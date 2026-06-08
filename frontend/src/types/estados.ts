/**
 * Uniones de estados y sus metadatos de presentación.
 * Cada estado lleva las variables CSS ya definidas en base.css.
 */

// ── Estado de Cita ────────────────────────────────────────────────────────────

export type EstadoCita =
  | 'confirmada'
  | 'pendiente'
  | 'cancelada'
  | 'completada'
  | 'bloqueado'
  | 'no-show'

export interface EstadoMeta {
  readonly label: string
  readonly desc: string
  readonly bg: string   // CSS var
  readonly bd: string   // CSS var
  readonly fg: string   // CSS var
  readonly dot: string  // CSS var
}

export const ESTADO_CITA_META: Readonly<Record<EstadoCita, EstadoMeta>> = {
  confirmada: { label: 'Confirmada', desc: 'Pago recibido',   bg: 'var(--st-green-bg)',  bd: 'var(--st-green-bd)',  fg: 'var(--st-green-fg)',  dot: 'var(--st-green-fg)'  },
  pendiente:  { label: 'Pendiente',  desc: 'Sin pago',        bg: 'var(--st-amber-bg)',  bd: 'var(--st-amber-bd)',  fg: 'var(--st-amber-fg)',  dot: 'var(--st-amber-fg)'  },
  cancelada:  { label: 'Cancelada',  desc: '—',               bg: 'var(--st-red-bg)',    bd: 'var(--st-red-bd)',    fg: 'var(--st-red-fg)',    dot: 'var(--st-red-fg)'    },
  completada: { label: 'Completada', desc: 'Servicio hecho',  bg: 'var(--st-slate-bg)',  bd: 'var(--st-slate-bd)',  fg: 'var(--st-slate-fg)',  dot: 'var(--st-slate-fg)'  },
  bloqueado:  { label: 'Bloqueado',  desc: 'No disponible',   bg: 'var(--st-gray-bg)',   bd: 'var(--st-gray-bd)',   fg: 'var(--st-gray-fg)',   dot: 'var(--st-gray-fg)'   },
  'no-show':  { label: 'No show',    desc: 'No asistió',      bg: 'var(--st-red-bg)',    bd: 'var(--st-red-bd)',    fg: 'var(--st-red-fg)',    dot: 'var(--st-red-fg)'    },
}

// ── Estado de Suscripción (admin plataforma) ──────────────────────────────────

export type EstadoSuscripcion =
  | 'activa'
  | 'trial'
  | 'morosa'
  | 'cancelada'

export interface EstadoSusMeta {
  readonly label: string
  readonly bg: string
  readonly fg: string
  readonly bd: string
}

export const ESTADO_SUS_META: Readonly<Record<EstadoSuscripcion, EstadoSusMeta>> = {
  activa:    { label: 'Activa',    bg: 'var(--st-green-bg)', fg: 'var(--st-green-fg)', bd: 'var(--st-green-bd)' },
  trial:     { label: 'Prueba',    bg: 'var(--accent-soft)', fg: 'var(--accent)',       bd: 'var(--accent-bd)'   },
  morosa:    { label: 'Morosa',    bg: 'var(--st-amber-bg)', fg: 'var(--st-amber-fg)', bd: 'var(--st-amber-bd)' },
  cancelada: { label: 'Cancelada', bg: 'var(--st-red-bg)',   fg: 'var(--st-red-fg)',   bd: 'var(--st-red-bd)'   },
}

// ── Estado de Pago (admin plataforma) ─────────────────────────────────────────

export type EstadoPago =
  | 'exitoso'
  | 'fallido'
  | 'pendiente'

export interface EstadoPagoMeta {
  readonly label: string
  readonly bg: string
  readonly fg: string
  readonly bd: string
}

export const ESTADO_PAGO_META: Readonly<Record<EstadoPago, EstadoPagoMeta>> = {
  exitoso:   { label: 'Exitoso',   bg: 'var(--st-green-bg)', fg: 'var(--st-green-fg)', bd: 'var(--st-green-bd)' },
  fallido:   { label: 'Fallido',   bg: 'var(--st-red-bg)',   fg: 'var(--st-red-fg)',   bd: 'var(--st-red-bd)'   },
  pendiente: { label: 'Pendiente', bg: 'var(--st-amber-bg)', fg: 'var(--st-amber-fg)', bd: 'var(--st-amber-bd)' },
}
