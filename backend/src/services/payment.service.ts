import axios from "axios";
import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "../config/env";
import { Cita, Pago, Cliente, Horario, Servicio, Barbero } from "../models";
import { HttpError } from "../utils/http";
import whatsappService from "../whatsapp.factory";
import { notificationService } from "./notification.service";
import logger from "../utils/logger";

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

  async createPaymentLink(paymentData: {
    precio: number;
    id: string;
  }): Promise<string | null> {
    const payment = await this.createPayment(paymentData);

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

      console.log("wompi response data", JSON.stringify(response.data));

      const linkId = response.data.data.id;
      console.log("wompi response linkId", linkId);

      await payment.update({ paymentLinkId: linkId });
      return `https://checkout.wompi.co/l/${linkId}`;
    } catch (error) {
      logger.error("Wompi payment link error", { error: String(error) });
      throw new HttpError(502, "No fue posible generar el enlace de pago");
    }
  }

  async refundPayment(paymentId: string, reason: string = "customer_request"): Promise<void> {
    if (!env.wompiPrivateKey) {
      throw new HttpError(503, "Servicio de reembolsos no configurado");
    }

    const payment = await Pago.findByPk(paymentId);
    if (!payment) {
      throw new HttpError(404, "Pago no encontrado");
    }

    if (payment.estado !== "exitoso") {
      throw new HttpError(409, "Solo se pueden reembolsar pagos exitosos");
    }

    if (!payment.transactionId) {
      throw new HttpError(409, "No se puede reembolsar: transacción no identificada");
    }

    const cita = await Cita.findByPk(payment.idCita);
    if (!cita) {
      throw new HttpError(404, "Cita no encontrada");
    }

    // Check if booking is within 24 hours
    const bookingDate = new Date(`${cita.idHorario}`);
    const now = new Date();
    const hoursDiff = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      throw new HttpError(409, "No se pueden reembolsar pagos menos de 24 horas antes de la cita");
    }

    try {
      await axios.post(
        `${env.wompiApiUrl}/transactions/${payment.transactionId}/refunds`,
        {
          amount_in_cents: Math.round(payment.monto * 100),
          reason,
        },
        { headers: { Authorization: `Bearer ${env.wompiPrivateKey}` } },
      );

      await payment.update({ estado: "reembolsado" });
      logger.info(`Payment refunded successfully`, { paymentId, transactionId: payment.transactionId });
    } catch (error) {
      logger.error("Wompi refund error", { error: String(error), paymentId });
      throw new HttpError(502, "No fue posible procesar el reembolso");
    }
  }

  verifyEvent(event: WompiEvent, headerChecksum?: string): void {
    console.log("verifyEvent", JSON.stringify({ event, headerChecksum }));

    if (!env.wompiEventsSecret) {
      console.log("Webhook de pagos no configurado");
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
      console.log("Firma de evento Wompi invalida");

      throw new HttpError(401, "Firma de evento Wompi invalida");
    }
  }

  async handleEvent(event: WompiEvent, headerChecksum?: string): Promise<void> {
    console.log("handleEvent service", JSON.stringify(event));

    this.verifyEvent(event, headerChecksum);
    if (event.event !== "transaction.updated" || !event.data.transaction) {
      throw new HttpError(400, "transaction no event");
    }

    console.log("verified");

    const transaction = event.data.transaction;
    const payment = transaction.payment_link_id
      ? await Pago.findOne({
          where: { paymentLinkId: transaction.payment_link_id },
        })
      : await Pago.findOne({ where: { referencia: transaction.reference } });
    console.log("payment", JSON.stringify({ payment }));

    if (!payment) {
      throw new HttpError(
        500,
        "Pago no ha sido encontrado para: ",
        JSON.stringify(transaction),
      );
    }
    if (transaction.amount_in_cents !== Math.round(payment.monto * 100)) {
      console.log("El valor pagado no corresponde al anticipo");

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

    const cita = (await Cita.findByPk(payment.idCita, {
      include: [
        { model: Cliente, as: "cliente", required: false },
        {
          model: Horario,
          as: "horario",
          required: false,
          include: [{ model: Servicio, as: "servicio", required: false }],
        },
      ],
    })) as any;

    if (cita) {
      const cliente = await Cliente.findByPk(cita.idCliente);
      if (cliente) {
        if (estado === "exitoso") {
          await cita.update({ estado: "confirmada" });

          // Send confirmation notification
          try {
            if (cita.horario && cita.horario.servicio) {
              const barbero = await Barbero.findByPk(cita.horario.servicio.idBarbero);
              const barberName = barbero
                ? `${barbero.nombres} ${barbero.apellidos}`.trim()
                : "Barbero";

              const dateTime = `${cita.horario.fecha} ${cita.horario.horaInicio.slice(0, 5)}`;
              await notificationService.sendBookingConfirmation({
                customerName: `${cliente.nombres} ${cliente.apellidos}`.trim(),
                customerPhone: cliente.celular,
                barberName,
                serviceName: cita.horario.servicio.nombre,
                dateTime,
                bookingId: cita.id as any,
              });
            }
          } catch (error) {
            logger.error("Error sending booking confirmation", { error: String(error) });
          }

          // Keep legacy WhatsApp notification for backwards compatibility
          await whatsappService.sendText(
            cliente.celular,
            `✅ ¡Pago Recibido por PSE! Tu cita para el servicio ha sido agendada con éxito. ¡Te esperamos!`
          ).catch(logger.error);
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
