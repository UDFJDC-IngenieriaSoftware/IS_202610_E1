import { z } from "zod";

export const authSchemas = {
  register: z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Contraseña debe tener mínimo 6 caracteres"),
    name: z.string().min(2, "Nombre debe tener mínimo 2 caracteres"),
  }),
  login: z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Contraseña requerida"),
  }),
};

export const bookingSchemas = {
  create: z.object({
    barberId: z.number().int().positive(),
    serviceId: z.number().int().positive(),
    date: z.string().date(),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora debe ser HH:mm"),
    customerPhone: z.string().regex(/^\+?\d{10,}$/, "Teléfono inválido"),
  }),
  update: z.object({
    date: z.string().date().optional(),
    time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    status: z.enum(["confirmed", "cancelled", "completed"]).optional(),
  }),
};

export const scheduleSchemas = {
  create: z.object({
    barberId: z.number().int().positive(),
    dayOfWeek: z.enum(["0", "1", "2", "3", "4", "5", "6"]),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  update: z.object({
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  }),
};

export const serviceSchemas = {
  create: z.object({
    name: z.string().min(2, "Nombre debe tener mínimo 2 caracteres"),
    description: z.string().optional(),
    duration: z.number().int().positive("Duración debe ser positiva"),
    price: z.number().nonnegative("Precio no puede ser negativo"),
  }),
  update: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    duration: z.number().int().positive().optional(),
    price: z.number().nonnegative().optional(),
  }),
};

export const paymentSchemas = {
  create: z.object({
    bookingId: z.number().int().positive(),
    amount: z.number().positive("Monto debe ser mayor a 0"),
    method: z.enum(["pse", "card", "transfer"]),
  }),
  webhook: z.object({
    id: z.string(),
    status: z.enum(["APPROVED", "DECLINED", "PENDING"]),
    amount_in_cents: z.number(),
    reference: z.string().optional(),
  }),
};

export const customerSchemas = {
  create: z.object({
    phone: z.string().regex(/^\+?\d{10,}$/),
    name: z.string().min(2),
    email: z.string().email().optional(),
  }),
  update: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
  }),
};
