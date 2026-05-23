/**
 * Utilidades de formato para la UI.
 * Sin side-effects — funciones puras y testeables.
 */

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const

const DIAS_SEMANA = [
  'domingo', 'lunes', 'martes', 'miércoles',
  'jueves', 'viernes', 'sábado',
] as const

// ── Moneda ────────────────────────────────────────────────────────────────────

/**
 * Formatea un número entero en pesos colombianos.
 * @example fmtCOP(28000) → "$28.000"
 */
export function fmtCOP(value: number): string {
  return '$' + value.toLocaleString('es-CO')
}

// ── Fechas ────────────────────────────────────────────────────────────────────

/**
 * Formatea una fecha ISO como texto largo en español.
 * @example fmtFechaLarga("2026-05-08") → "viernes 8 de mayo"
 */
export function fmtFechaLarga(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

/**
 * Formatea una fecha ISO como dd/mm/yyyy.
 * @example fmtFechaCorta("2026-05-08") → "08/05/2026"
 */
export function fmtFechaCorta(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

/**
 * Devuelve el nombre del mes abreviado (3 letras, primera en mayúscula).
 * @example fmtMesCorto("2026-05-08") → "May"
 */
export function fmtMesCorto(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const mes = MESES[d.getMonth()]
  return mes.charAt(0).toUpperCase() + mes.slice(1, 3)
}

/**
 * Devuelve solo el día del mes (sin ceros a la izquierda).
 * @example fmtDia("2026-05-08") → "8"
 */
export function fmtDia(iso: string): string {
  return String(new Date(iso + 'T12:00:00').getDate())
}

// ── Texto ─────────────────────────────────────────────────────────────────────

/**
 * Devuelve las iniciales de un nombre (máximo 2 letras, en mayúsculas).
 * @example initials("Andrés Mejía") → "AM"
 * @example initials("Felipe")       → "FE"
 */
export function initials(nombre: string): string {
  const partes = nombre.trim().split(/\s+/)
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase()
  }
  return nombre.slice(0, 2).toUpperCase()
}

/**
 * Trunca un texto a `maxLen` caracteres añadiendo "…" si es necesario.
 */
export function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text
}

/**
 * Formatea un número como "$826k" o "$9.91M" (útil para métricas admin).
 * @example fmtK(826000)   → "$826k"
 * @example fmtK(9912000)  → "$9.91M"
 */
export function fmtK(value: number): string {
  if (value >= 1_000_000) return '$' + (value / 1_000_000).toFixed(2) + 'M'
  if (value >= 1_000)     return '$' + Math.round(value / 1_000) + 'k'
  return fmtCOP(value)
}
