import { Request, Response } from "express";
import { Op } from "sequelize";
import { AuthenticatedRequest } from "../middleware/auth";
import { Cita, Cliente, Horario, Pago, Servicio } from "../models";
import { BookingService } from "../services/booking.service";
import { PaymentService, WompiEvent } from "../services/payment.service";
import { HttpError, requiredString } from "../utils/http";

const payments = new PaymentService();
const bookings = new BookingService();

async function ownedPayment(req: AuthenticatedRequest): Promise<Pago> {
  const bookingId = requiredString(
    req.params.bookingId ?? req.body?.bookingId,
    "bookingId",
  );
  await bookings.getOwned(bookingId, req.auth!.sub);
  const payment = await Pago.findOne({ where: { idCita: bookingId } });
  if (!payment) throw new HttpError(404, "Pago no encontrado");
  return payment;
}

export async function getPayment(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  res.json(payments.serialize(await ownedPayment(req)));
}

export async function createPaymentLink(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const payment = await ownedPayment(req);
  const paymentUrl = await payments.createPaymentLink({
    id: payment.idCita,
    precio: payment.monto,
  });
  if (!paymentUrl) {
    throw new HttpError(503, "Wompi no está configurado en este entorno");
  }
  res.json(payments.serialize(payment, paymentUrl));
}

export async function listPayments(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { desde, hasta } = req.query as Record<string, string>;

  const whereHorario: Record<string, unknown> = {};
  if (desde || hasta) {
    const fechaWhere: Record<string, string> = {};
    if (desde) fechaWhere[Op.gte as unknown as string] = desde;
    if (hasta) fechaWhere[Op.lte as unknown as string] = hasta;
    whereHorario.fecha = fechaWhere;
  }

  const pagos = (await Pago.findAll({
    include: [
      {
        model: Cita,
        as: "cita",
        required: true,
        include: [
          { model: Cliente, as: "cliente", required: true },
          {
            model: Horario,
            as: "horario",
            required: true,
            where: Object.keys(whereHorario).length ? whereHorario : undefined,
            include: [
              {
                model: Servicio,
                as: "servicio",
                required: true,
                where: { idBarbero: req.auth!.sub },
              },
            ],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  })) as any[];

  res.json(
    pagos.map((p) => ({
      id: p.id,
      citaId: p.idCita,
      monto: p.monto,
      estado: p.estado,
      referencia: p.referencia,
      fecha: p.createdAt
        ? (p.createdAt as Date).toISOString().split("T")[0]
        : null,
      cliente: p.cita?.cliente
        ? `${p.cita.cliente.nombres} ${p.cita.cliente.apellidos}`.trim()
        : "—",
      servicio: p.cita?.horario?.servicio?.nombre ?? "—",
    })),
  );
}

export async function paymentWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  await payments.handleEvent(
    req.body as WompiEvent,
    typeof req.headers["x-event-checksum"] === "string"
      ? req.headers["x-event-checksum"]
      : undefined,
  );
  res.json({ received: true });
}
