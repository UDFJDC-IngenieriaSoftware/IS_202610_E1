/**
 * Tipos de dominio de MiTurno.
 * Son la fuente de verdad del contrato con el backend real.
 */

import type { EstadoCita, EstadoSuscripcion, EstadoPago } from './estados'

// ── Barbero local (usuario autenticado en el panel) ──────────────────────────

export interface BarberoPerfil {
  readonly id: string
  readonly nombre: string
  readonly barberia: string
  readonly ciudad: string
  readonly inicial: string
}

// ── Cita ─────────────────────────────────────────────────────────────────────

export interface Cita {
  readonly id: string
  readonly fecha: string       // ISO yyyy-mm-dd
  readonly hora: string        // HH:mm
  readonly duracion: number    // minutos
  readonly cliente: string
  readonly telefono: string
  readonly servicio: string
  readonly precio: number      // COP
  readonly estado: EstadoCita
}

// ── Servicio ──────────────────────────────────────────────────────────────────

export interface Servicio {
  readonly id: string
  readonly nombre: string
  readonly duracion: number    // minutos
  readonly precio: number      // COP
  readonly activo: boolean
  readonly descripcion: string
}

// ── Horario ───────────────────────────────────────────────────────────────────

export interface HorarioDia {
  readonly dia: string         // nombre en español, p. ej. "Lunes"
  readonly idx: number         // 0 = domingo … 6 = sábado
  readonly activo: boolean
  readonly inicio: string      // HH:mm
  readonly fin: string         // HH:mm
  readonly descansoIni: string // HH:mm | ""
  readonly descansoFin: string // HH:mm | ""
}

export interface DiaLibre {
  readonly id: string
  readonly fecha: string       // ISO yyyy-mm-dd
  readonly motivo: string
}

// ── Plan SaaS ─────────────────────────────────────────────────────────────────

export type PlanId = 'solo' | 'pro' | 'estudio'

export interface Plan {
  readonly id: PlanId
  readonly nombre: string
  readonly precio: number      // COP / mes
  readonly color: string       // CSS var o valor
  readonly limites: string
  readonly features: ReadonlyArray<string>
}

// ── Barbero (vista admin de plataforma) ───────────────────────────────────────

export interface Barbero {
  readonly id: string
  readonly nombre: string
  readonly barberia: string
  readonly ciudad: string
  readonly plan: PlanId
  readonly estado: EstadoSuscripcion
  readonly alta: string          // ISO yyyy-mm-dd
  readonly proxCobro: string     // ISO yyyy-mm-dd | "—"
  readonly citasMes: number
  readonly citasMaximo: number | null
  readonly mrr: number           // COP
  readonly uso: number           // porcentaje 0-100
  readonly lastSeen: string
}

// ── Pago ──────────────────────────────────────────────────────────────────────

export type MetodoPago = 'PSE' | 'Tarjeta'

export interface Pago {
  readonly id: string
  readonly fecha: string         // ISO yyyy-mm-dd
  readonly barberoId: string
  readonly barbero: string
  readonly plan: PlanId
  readonly monto: number         // COP
  readonly estado: EstadoPago
  readonly metodo: MetodoPago
  readonly referencia: string
}

// ── Pago de cita (vista barbero) ─────────────────────────────────────────────

export interface PagoBooking {
  readonly id: string
  readonly citaId: string
  readonly monto: number        // anticipo cobrado (COP)
  readonly estado: EstadoPago
  readonly referencia: string | null
  readonly fecha: string        // ISO yyyy-mm-dd
  readonly cliente: string      // nombre completo
  readonly servicio: string
}

// ── Cliente con estadísticas (vista barbero) ──────────────────────────────────

export interface ClienteConStats {
  readonly id: string
  readonly nombres: string
  readonly apellidos: string
  readonly email: string
  readonly celular: string
  readonly totalCitas: number
  readonly ultimaVisita: string | null   // ISO yyyy-mm-dd
  readonly servicioFrecuente: string | null
}

// ── Métricas plataforma ───────────────────────────────────────────────────────

export interface MetricasPlataforma {
  readonly mrr: number
  readonly arr: number
  readonly totalBarberos: number
  readonly trial: number
  readonly cancelados: number
  readonly nuevosMes: number
  readonly churnPct: number
  readonly conversionPct: number
  readonly ticketProm: number
  readonly mrrSerie: ReadonlyArray<number>
  readonly mesesSerie: ReadonlyArray<string>
  readonly signupsSerie: ReadonlyArray<number>
}
