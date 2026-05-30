import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { Pago } from "../models";
import { BookingService } from "../services/booking.service";
import { PaymentService, WompiEvent } from "../services/payment.service";
import { HttpError, requiredString } from "../utils/http";

const payments = new PaymentService();
const bookings = new BookingService();

async function ownedPayment(req: AuthenticatedRequest): Promise<Pago> {
  const bookingId = requiredString(req.params.bookingId ?? req.body?.bookingId, "bookingId");
  await bookings.getOwned(bookingId, req.auth!.sub);
  const payment = await Pago.findOne({ where: { idCita: bookingId } });
  if (!payment) throw new HttpError(404, "Pago no encontrado");
  return payment;
}

export async function getPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json(payments.serialize(await ownedPayment(req)));
}

export async function createPaymentLink(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payment = await ownedPayment(req);
  const paymentUrl = await payments.createPaymentLink(payment);
  if (!paymentUrl) {
    throw new HttpError(503, "Wompi no esta configurado en este entorno");
  }
  res.json(payments.serialize(payment, paymentUrl));
}

export async function refundPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const paymentId = requiredString(req.params.paymentId ?? req.body?.paymentId, "paymentId");
  const reason = req.body?.reason ?? "customer_request";

  // Verify ownership
  const payment = await Pago.findByPk(paymentId);
  if (!payment) throw new HttpError(404, "Pago no encontrado");

  const booking = await bookings.getOwned(payment.idCita, req.auth!.sub);
  if (!booking) throw new HttpError(403, "No tienes permiso para reembolsar este pago");

  await payments.refundPayment(paymentId, reason);
  res.json({ success: true, message: "Pago reembolsado exitosamente" });
}

export async function paymentWebhook(req: Request, res: Response): Promise<void> {
  await payments.handleEvent(
    req.body as WompiEvent,
    typeof req.headers["x-event-checksum"] === "string"
      ? req.headers["x-event-checksum"]
      : undefined,
  );
  res.json({ received: true });
}
