import axios from "axios";
import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "../config/env";
import { Cita, Pago, Cliente, Horario } from "../models";
import { HttpError } from "../utils/http";
import whatsappService from "../whatsapp.factory";

interface WompiLinkResponse {
  data: { id: string };
}

interface WompiTransaction {
  id: string;
  status: string;
  amount_in_cents: number;
  reference?: string;
  payment_link_id?: string;
}

interface WompiEvent {
  event: string;
  data: { transaction?: WompiTransaction };
  sent_at: string;
  timestamp: number;
  signature: { properties: string[]; checksum: string };
}

function serialize(payment: Pago, paymentUrl?: string | null) {
  return {
    id: payment.id,
    bookingId: payment.idCita,
    amount: payment.monto,
    status: payment.estado,
    reference: payment.referencia,
    transactionId: payment.transactionId,
    paymentUrl: paymentUrl ?? null,
  };
}

function nestedValue(body: WompiEvent, property: string): string {
  const value = property.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, body.data);
  return String(value ?? "");
}

export class PaymentService {
  serialize = serialize;

  public async createPayment(appointment: {
    precio: number;
    id: string;
  }): Promise<Pago> {
    console.log("createPayment", { appointment });

    const newPayment = await Pago.create({
      // id,
      monto: appointment.precio,
      estado: "pendiente",
      referencia: `miturno-${appointment.id}-${Date.now()}`,
      // paymentLinkId,
      // transactionId,
      idCita: appointment.id,
    });

    return newPayment;
  }

  async createPaymentLink(payment: Pago): Promise<string | null> {
    console.log("createPaymentLink", { payment });
    console.log("createPaymentLink env ->", { env });

    if (!env.wompiPrivateKey) throw Error("wompiPrivateKey does not exist");

    try {
      const requestData = {
        name: `Anticipo cita ${payment.idCita.slice(0, 8)}`,
        description: "Anticipo de reserva MiTurno",
        single_use: true,
        collect_shipping: false,
        currency: "COP",
        amount_in_cents: Math.round(payment.monto * 100),
        sku: payment.idCita,
        redirect_url: env.paymentRedirectUrl,
      };
      const headers = {
        headers: { Authorization: `Bearer ${env.wompiPrivateKey}` },
      };
      const url = `${env.wompiApiUrl}/payment_links`;

      console.log("request", JSON.stringify({ requestData, headers, url }));

      const response = await axios.post<WompiLinkResponse>(
        url,
        requestData,
        headers,
      );

      // console.log("wompi response", JSON.stringify(response));
      console.log("wompi response data", JSON.stringify(response.data));

      const linkId = response.data.data.id;
      console.log("wompi response linkId", linkId);

      await payment.update({ paymentLinkId: linkId });
      return `https://checkout.wompi.co/l/${linkId}`;
    } catch (error) {
      console.error("Wompi payment link error:", error);
      throw new HttpError(502, "No fue posible generar el enlace de pago");
    }
  }

  verifyEvent(event: WompiEvent, headerChecksum?: string): void {
    if (!env.wompiEventsSecret) {
      throw new HttpError(503, "Webhook de pagos no configurado");
    }
    const values = event.signature.properties
      .map((property) => nestedValue(event, property))
      .join("");
    const expected = createHash("sha256")
      .update(`${values}${event.timestamp}${env.wompiEventsSecret}`)
      .digest("hex")
      .toUpperCase();
    const received = (
      headerChecksum ||
      event.signature.checksum ||
      ""
    ).toUpperCase();
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      throw new HttpError(401, "Firma de evento Wompi invalida");
    }
  }

  async handleEvent(event: WompiEvent, headerChecksum?: string): Promise<void> {
    this.verifyEvent(event, headerChecksum);
    if (event.event !== "transaction.updated" || !event.data.transaction)
      return;
    const transaction = event.data.transaction;
    const payment = transaction.payment_link_id
      ? await Pago.findOne({
          where: { paymentLinkId: transaction.payment_link_id },
        })
      : await Pago.findOne({ where: { referencia: transaction.reference } });
    if (!payment) return;
    if (transaction.amount_in_cents !== Math.round(payment.monto * 100)) {
      throw new HttpError(409, "El valor pagado no corresponde al anticipo");
    }
    const paymentStatus: Record<string, string> = {
      APPROVED: "exitoso",
      PENDING: "pendiente",
      DECLINED: "fallido",
      VOIDED: "fallido",
      ERROR: "fallido",
    };
    const estado = paymentStatus[transaction.status] || "pendiente";
    await payment.update({ estado, transactionId: transaction.id });

    const cita = await Cita.findByPk(payment.idCita);
    if (cita) {
      const cliente = await Cliente.findByPk(cita.idCliente);
      if (cliente) {
        if (estado === "exitoso") {
          await cita.update({ estado: "confirmada" });
          await whatsappService
            .sendText(
              cliente.celular,
              `✅ ¡Pago Recibido por PSE! Tu cita para el servicio ha sido agendada con éxito. ¡Te esperamos!`,
            )
            .catch(console.error);
        } else if (estado === "fallido") {
          await cita.update({ estado: "cancelada" });
          await Horario.update(
            { estado: "libre" },
            { where: { id: cita.idHorario } },
          );
          await whatsappService
            .sendText(
              cliente.celular,
              `❌ Lo sentimos. El pago de tu cita a través de PSE fue rechazado por tu banco o falló. Tu reservación ha sido cancelada y el horario liberado.`,
            )
            .catch(console.error);
        }
      }
    }
  }
}

export type { WompiEvent };
