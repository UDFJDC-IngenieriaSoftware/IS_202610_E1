/**
 * Schemas Zod reutilizables para validación frontend
 *
 * Deben coincidir con los schemas del backend en src/utils/validators.ts
 */

import { z } from 'zod'

// Campos comunes
const emailSchema = z.string().email('Email inválido')
const passwordSchema = z.string().min(6, 'Mínimo 6 caracteres')
const phoneSchema = z.string().regex(/^\+?\d{10,}$/, 'Teléfono inválido')
const nameSchema = z.string().min(2, 'Nombre debe tener mínimo 2 caracteres')

// Auth
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})
export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
    name: nameSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
export type RegisterFormData = z.infer<typeof registerSchema>

// Servicios
export const serviceSchema = z.object({
  name: nameSchema,
  description: z.string().optional(),
  duration: z.number().int().positive('Duración debe ser positiva'),
  price: z.number().nonnegative('Precio no puede ser negativo'),
})
export type ServiceFormData = z.infer<typeof serviceSchema>

// Citas
export const bookingSchema = z.object({
  barberId: z.number().int().positive('Selecciona un barbero'),
  serviceId: z.number().int().positive('Selecciona un servicio'),
  date: z.string().date('Fecha inválida'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora debe ser HH:mm'),
  customerPhone: phoneSchema,
})
export type BookingFormData = z.infer<typeof bookingSchema>

// Pagos
export const refundSchema = z.object({
  reason: z.enum(['customer_request', 'customer_no_show', 'service_cancellation', 'duplicate_charge']),
})
export type RefundFormData = z.infer<typeof refundSchema>

// Perfil
export const profileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
})
export type ProfileFormData = z.infer<typeof profileSchema>

// Password change
export const passwordChangeSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>
