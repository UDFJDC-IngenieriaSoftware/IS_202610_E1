/**
 * Utilidades de cálculo de fechas para agenda y calendario.
 * HOY_ISO es la "fecha base" — en desarrollo usa el mock,
 * en producción se reemplaza por new Date().toISOString().slice(0,10).
 */

// ── Fecha base ────────────────────────────────────────────────────────────────

/**
 * Fecha de hoy en formato ISO yyyy-mm-dd.
 * Cambia VITE_TODAY en .env para sobreescribir en desarrollo.
 */
const _envToday = import.meta.env.VITE_TODAY
export const HOY_ISO: string =
  (_envToday && /^\d{4}-\d{2}-\d{2}$/.test(_envToday))
    ? _envToday
    : new Date().toISOString().slice(0, 10)

// ── Parsing ───────────────────────────────────────────────────────────────────

/**
 * Convierte "HH:mm" a minutos desde medianoche.
 * @example parseHM("09:30") → 570
 */
export function parseHM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/**
 * Convierte minutos desde medianoche a "HH:mm".
 * @example minutesToHM(570) → "09:30"
 */
export function minutesToHM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Convierte minutos a porcentaje vertical relativo al rango visible
 * de la grilla (de startMin a startMin + totalMin).
 *
 * Usado para posicionar eventos en el WeekGrid.
 * @example minutesToY(570, 540, 780) → 12.5  // (570-540)/780 * 100
 */
export function minutesToY(
  minutes: number,
  startMin: number,
  totalMin: number,
): number {
  return ((minutes - startMin) / totalMin) * 100
}

// ── Semana ────────────────────────────────────────────────────────────────────

export interface DiaInfo {
  iso: string       // yyyy-mm-dd
  num: number       // día del mes
  dayName: string   // "lun", "mar", ...
  isToday: boolean
}

const DIA_ABBR = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] as const

/**
 * Devuelve un array de 7 DiaInfo para la semana que contiene `isoRef`.
 * La semana empieza el lunes (idx 1).
 */
export function buildWeek(isoRef: string): DiaInfo[] {
  const ref = new Date(isoRef + 'T12:00:00')
  if (isNaN(ref.getTime())) return buildWeek(new Date().toISOString().slice(0, 10))
  // ajustar al lunes de esa semana
  const dayOfWeek = ref.getDay() // 0 = domingo
  const distToMonday = (dayOfWeek + 6) % 7   // lunes = 0
  const monday = new Date(ref)
  monday.setDate(ref.getDate() - distToMonday)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    return {
      iso,
      num: d.getDate(),
      dayName: DIA_ABBR[d.getDay()],
      isToday: iso === HOY_ISO,
    }
  })
}

// ── Mes ───────────────────────────────────────────────────────────────────────

export interface CeldaMes {
  iso: string | null  // null = celda de relleno (antes del día 1 o después del último)
  num: number | null
  isToday: boolean
}

/**
 * Devuelve la cuadrícula de celdas de un mes completo (múltiplos de 7).
 * La primera columna es el lunes.
 * @param isoRef cualquier fecha dentro del mes deseado
 */
export function buildMonthGrid(isoRef: string): CeldaMes[] {
  const ref = new Date(isoRef + 'T12:00:00')
  if (isNaN(ref.getTime())) return buildMonthGrid(new Date().toISOString().slice(0, 10))
  const year = ref.getFullYear()
  const month = ref.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)

  // Convierte el weekday de JS (0=dom) a base-lunes (0=lun … 6=dom)
  const startPad = (firstDay.getDay() + 6) % 7
  // Posición del último día en la fila (0=lun … 6=dom)
  // Si lastDay cae en domingo (pos 6) → 0 celdas de relleno; si cae en sábado → 1; etc.
  const lastPos  = (lastDay.getDay() + 6) % 7
  const endPad   = lastPos === 6 ? 0 : 6 - lastPos

  const cells: CeldaMes[] = []

  // Celdas vacías al inicio
  for (let i = 0; i < startPad; i++) {
    cells.push({ iso: null, num: null, isToday: false })
  }

  // Días del mes
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    const iso = date.toISOString().slice(0, 10)
    cells.push({ iso, num: d, isToday: iso === HOY_ISO })
  }

  // Celdas vacías al final
  for (let i = 0; i < endPad; i++) {
    cells.push({ iso: null, num: null, isToday: false })
  }

  return cells
}

/**
 * Añade o resta `n` días a una fecha ISO y devuelve la nueva fecha ISO.
 */
export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00')
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * Devuelve el nombre del mes en español para una fecha ISO.
 * @example monthName("2026-05-08") → "mayo"
 */
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const

export function monthName(iso: string): string {
  return MESES[new Date(iso + 'T12:00:00').getMonth()]
}

export function yearOf(iso: string): number {
  return new Date(iso + 'T12:00:00').getFullYear()
}
