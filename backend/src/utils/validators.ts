import { z } from "zod";

export const authSchemas = {
  register: z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Contraseña debe tener mínimo 6 caracteres"),
    // Spanish names (primary)
    nombres: z.string().min(2).optional(),
    apellidos: z.string().min(2).optional(),
    celular: z.string().min(7).optional(),
    barberia: z.string().optional(),
    ciudad: z.string().optional(),
    direccion: z.string().optional(),
    plan: z.enum(["solo", "pro", "estudio"]).optional(),
    // English aliases
    name: z.string().min(2).optional(),
    whatsapp: z.string().min(7).optional(),
    nombreBarberia: z.string().optional(),
    // Nested barbershop object
    barbershop: z.object({
      name: z.string().optional(),
      city: z.string().optional(),
      address: z.string().optional(),
    }).optional(),
  }).refine(
    (d) => d.nombres !== undefined || d.name !== undefined,
    { message: "nombres es requerido" }
  ),
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
    estado: z.enum(["confirmada", "cancelada", "completada", "no-show", "bloqueado", "pendiente"]).optional(),
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
    nombre: z.string().min(2, "Nombre debe tener mínimo 2 caracteres"),
    descripcion: z.string().optional(),
    duracion: z.number().int().positive("Duración debe ser positiva"),
    precio: z.number().nonnegative("Precio no puede ser negativo"),
    activo: z.boolean().optional(),
    // English aliases kept for API versioned router
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    duration: z.number().int().positive().optional(),
    price: z.number().nonnegative().optional(),
  }).refine(
    (d) => d.nombre !== undefined || d.name !== undefined,
    { message: "nombre es requerido" }
  ).refine(
    (d) => d.duracion !== undefined || d.duration !== undefined,
    { message: "duracion es requerida" }
  ).refine(
    (d) => d.precio !== undefined || d.price !== undefined,
    { message: "precio es requerido" }
  ),
  update: z.object({
    nombre: z.string().min(2).optional(),
    descripcion: z.string().optional(),
    duracion: z.number().int().positive().optional(),
    precio: z.number().nonnegative().optional(),
    activo: z.boolean().optional(),
    // English aliases kept for API versioned router
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
    nombres:   z.string().min(1).optional(),
    apellidos: z.string().optional(),
    email:     z.string().email().optional(),
  }),
};
