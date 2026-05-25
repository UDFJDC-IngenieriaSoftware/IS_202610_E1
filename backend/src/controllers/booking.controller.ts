import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { AvailabilityService } from "../services/availability.service";
import { BookingService, serializeBooking } from "../services/booking.service";
import { PaymentService } from "../services/payment.service";
import { emailString, HttpError, isoDate, requiredString } from "../utils/http";

const bookings = new BookingService();
const availability = new AvailabilityService();
const payments = new PaymentService();

function date(value: unknown): string {
  return isoDate(value);
}

function hour(value: unknown): string {
  const result = requiredString(value, "hora");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(result)) {
    throw new HttpError(400, "hora debe tener formato HH:MM");
  }
  return result;
}

export async function getAvailability(req: Request, res: Response): Promise<void> {
  const serviceId = requiredString(
    req.body?.idServicio ?? req.body?.serviceId ?? req.query.idServicio ?? req.query.serviceId,
    "idServicio",
  );
  const fecha = date(req.body?.fecha ?? req.body?.date ?? req.query.fecha ?? req.query.date);
  res.json(await availability.getForService(serviceId, fecha));
}

export async function createBooking(req: Request, res: Response): Promise<void> {
  const customer = req.body?.cliente ?? req.body?.customer ?? {};
  const celular = requiredString(customer.celular ?? customer.phone, "cliente.celular", 7);
  const { booking, payment } = await bookings.create({
    idServicio: requiredString(req.body?.idServicio ?? req.body?.serviceId, "idServicio"),
    fecha: date(req.body?.fecha ?? req.body?.date),
    hora: hour(req.body?.hora ?? req.body?.startTime),
    cliente: {
      nombres: requiredString(customer.nombres ?? customer.name, "cliente.nombres", 2),
      apellidos: requiredString(customer.apellidos ?? customer.lastName ?? "Cliente", "cliente.apellidos", 2),
      celular,
      email: emailString(customer.email ?? `${celular.replace(/\D/g, "")}@miturno.local`, "cliente.email"),
    },
  });
  let paymentUrl: string | null = null;
  let paymentWarning: string | undefined;
  try {
    paymentUrl = await payments.createPaymentLink(payment);
  } catch {
    paymentWarning = "Reserva creada; genera el enlace de pago nuevamente desde el panel.";
  }
  res.status(201).json({
    ...serializeBooking(booking),
    payment: {
      id: payment.id,
      amount: payment.monto,
      status: payment.estado,
      reference: payment.referencia,
      paymentUrl,
    },
    ...(paymentWarning ? { warning: paymentWarning } : {}),
  });
}

export async function listBookings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const list = await bookings.listForBarber(req.auth!.sub, {
    fecha: typeof req.query.fecha === "string" ? req.query.fecha : undefined,
    desde: typeof req.query.desde === "string" ? req.query.desde : undefined,
    hasta: typeof req.query.hasta === "string" ? req.query.hasta : undefined,
  });
  res.json(list.map(serializeBooking));
}

export async function getBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  const id = requiredString(req.params.id, "id");
  res.json(serializeBooking(await bookings.getOwned(id, req.auth!.sub)));
}

export async function updateBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  const id = requiredString(req.params.id, "id");
  const estado = requiredString(req.body?.estado ?? req.body?.status, "estado");
  res.json(serializeBooking(await bookings.updateStatus(id, req.auth!.sub, estado)));
}

export async function transitionBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  const transitions: Record<string, string> = {
    cancel: "cancelada",
    complete: "completada",
    "no-show": "no-show",
  };
  const id = requiredString(req.params.id, "id");
  const action = requiredString(req.params.action, "action");
  const estado = transitions[action];
  if (!estado) throw new HttpError(400, "Transicion invalida");
  res.json(serializeBooking(await bookings.updateStatus(id, req.auth!.sub, estado)));
}

export async function bookingStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const list = await bookings.listForBarber(req.auth!.sub);
  const total = list.length;
  const data = list.map(serializeBooking) as Array<{ estado: string; precio: number }>;
  res.json({
    total,
    confirmadas: data.filter((booking) => booking.estado === "confirmada").length,
    completadas: data.filter((booking) => booking.estado === "completada").length,
    canceladas: data.filter((booking) => booking.estado === "cancelada").length,
    ingresos: data
      .filter((booking) => booking.estado === "completada")
      .reduce((amount, booking) => amount + Number(booking.precio), 0),
  });
}
