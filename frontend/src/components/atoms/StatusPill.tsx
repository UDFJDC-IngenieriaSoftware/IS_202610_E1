/**
 * Átomo StatusPill — Pill especializada que lee los metadatos de estado
 * directamente desde ESTADO_CITA_META / ESTADO_SUS_META / ESTADO_PAGO_META.
 */
import { Pill } from './Pill'
import {
  ESTADO_CITA_META,
  ESTADO_SUS_META,
  ESTADO_PAGO_META,
} from '../../types/estados'
import type { EstadoCita, EstadoSuscripcion, EstadoPago } from '../../types'

type AnyEstado = EstadoCita | EstadoSuscripcion | EstadoPago

interface StatusPillProps {
  estado: AnyEstado
  /** Tipo de estado para seleccionar la tabla de metadatos correcta */
  tipo?: 'cita' | 'suscripcion' | 'pago'
}

function getMeta(estado: AnyEstado, tipo: StatusPillProps['tipo'] = 'cita') {
  if (tipo === 'suscripcion') {
    return ESTADO_SUS_META[estado as EstadoSuscripcion]
  }
  if (tipo === 'pago') {
    return ESTADO_PAGO_META[estado as EstadoPago]
  }
  return ESTADO_CITA_META[estado as EstadoCita]
}

export function StatusPill({ estado, tipo = 'cita' }: StatusPillProps) {
  const meta = getMeta(estado, tipo)
  return (
    <Pill
      label={meta.label}
      color={meta.fg}
      bg={meta.bg}
      border={meta.bd}
    />
  )
}
