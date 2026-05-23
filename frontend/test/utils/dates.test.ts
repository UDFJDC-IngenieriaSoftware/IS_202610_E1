/**
 * Tests de src/utils/dates.ts
 *
 * VITE_TODAY=2026-05-08 (viernes) está fijo en vite.config.ts → test.env,
 * por lo que HOY_ISO y buildWeek/buildMonthGrid son deterministas.
 */
import { describe, it, expect } from 'vitest'
import {
  HOY_ISO,
  parseHM,
  minutesToHM,
  minutesToY,
  addDays,
  buildWeek,
  buildMonthGrid,
  monthName,
  yearOf,
} from '../../src/utils/dates'

// ── HOY_ISO ───────────────────────────────────────────────────────────────────
describe('HOY_ISO', () => {
  it('usa VITE_TODAY cuando está definida', () => {
    expect(HOY_ISO).toBe('2026-05-08')
  })
})

// ── parseHM ───────────────────────────────────────────────────────────────────
describe('parseHM', () => {
  it('convierte "00:00" a 0 minutos', () => expect(parseHM('00:00')).toBe(0))
  it('convierte "09:30" a 570 minutos', () => expect(parseHM('09:30')).toBe(570))
  it('convierte "12:00" a 720 minutos', () => expect(parseHM('12:00')).toBe(720))
  it('convierte "23:59" a 1439 minutos', () => expect(parseHM('23:59')).toBe(1439))
})

// ── minutesToHM ───────────────────────────────────────────────────────────────
describe('minutesToHM', () => {
  it('convierte 0 a "00:00"', () => expect(minutesToHM(0)).toBe('00:00'))
  it('convierte 570 a "09:30"', () => expect(minutesToHM(570)).toBe('09:30'))
  it('convierte 65 a "01:05" (pad de ceros)', () => expect(minutesToHM(65)).toBe('01:05'))
  it('es inversa de parseHM', () => {
    const cases = ['09:30', '00:00', '23:45', '01:05']
    cases.forEach((t) => expect(minutesToHM(parseHM(t))).toBe(t))
  })
})

// ── minutesToY ────────────────────────────────────────────────────────────────
describe('minutesToY', () => {
  it('devuelve 0 cuando minutes === startMin', () => {
    expect(minutesToY(540, 540, 780)).toBe(0)
  })

  it('devuelve 100 cuando minutes === startMin + totalMin', () => {
    expect(minutesToY(1320, 540, 780)).toBe(100)
  })

  it('calcula posición intermedia correctamente', () => {
    // (570 - 540) / 780 * 100 ≈ 3.846
    expect(minutesToY(570, 540, 780)).toBeCloseTo(3.846, 2)
  })
})

// ── addDays ───────────────────────────────────────────────────────────────────
describe('addDays', () => {
  it('suma días positivos', () => {
    expect(addDays('2026-05-08', 7)).toBe('2026-05-15')
  })

  it('resta días negativos', () => {
    expect(addDays('2026-05-08', -1)).toBe('2026-05-07')
  })

  it('cruza cambio de mes', () => {
    expect(addDays('2026-05-31', 1)).toBe('2026-06-01')
  })

  it('cruza cambio de año', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('suma 0 devuelve la misma fecha', () => {
    expect(addDays('2026-05-08', 0)).toBe('2026-05-08')
  })
})

// ── buildWeek ─────────────────────────────────────────────────────────────────
describe('buildWeek', () => {
  // 2026-05-08 es viernes → semana: lun 04 … dom 10
  const week = buildWeek('2026-05-08')

  it('devuelve exactamente 7 días', () => {
    expect(week).toHaveLength(7)
  })

  it('empieza en lunes (dayName "lun")', () => {
    expect(week[0].dayName).toBe('lun')
    expect(week[0].iso).toBe('2026-05-04')
  })

  it('termina en domingo (dayName "dom")', () => {
    expect(week[6].dayName).toBe('dom')
    expect(week[6].iso).toBe('2026-05-10')
  })

  it('incluye la fecha de referencia', () => {
    const found = week.find((d) => d.iso === '2026-05-08')
    expect(found).toBeDefined()
    expect(found?.dayName).toBe('vie')
  })

  it('isToday=true solo para HOY_ISO', () => {
    const todayDays = week.filter((d) => d.isToday)
    expect(todayDays).toHaveLength(1)
    expect(todayDays[0].iso).toBe(HOY_ISO)
  })

  it('los isos están en formato yyyy-mm-dd', () => {
    week.forEach((d) => {
      expect(d.iso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})

// ── buildMonthGrid ────────────────────────────────────────────────────────────
describe('buildMonthGrid', () => {
  /**
   * Mayo 2026:
   *   - Empieza el viernes 1  → startPad = 4 (lun, mar, mié, jue vacíos)
   *   - Termina el domingo 31 → endPad   = 0 (domingo cierra la fila)
   *   - Total: 4 + 31 + 0    = 35 celdas (5 semanas exactas)
   */
  const grid = buildMonthGrid('2026-05-08')

  it('total de celdas es múltiplo de 7', () => {
    expect(grid.length % 7).toBe(0)
  })

  it('mayo 2026 ocupa exactamente 5 semanas (35 celdas)', () => {
    expect(grid).toHaveLength(35)
  })

  it('contiene exactamente 31 celdas reales (mayo tiene 31 días)', () => {
    const real = grid.filter((c) => c.iso !== null)
    expect(real).toHaveLength(31)
  })

  it('primera celda real es el día 1 del mes (viernes)', () => {
    const first = grid.find((c) => c.iso !== null)
    expect(first?.num).toBe(1)
    expect(first?.iso).toBe('2026-05-01')
  })

  it('hay 4 celdas de relleno al inicio (lun-jue antes del viernes 1)', () => {
    const startPadding = grid.slice(0, grid.findIndex((c) => c.iso !== null))
    expect(startPadding).toHaveLength(4)
  })

  it('no hay celdas de relleno al final (mayo termina en domingo)', () => {
    const lastReal = [...grid].reverse().findIndex((c) => c.iso !== null)
    expect(lastReal).toBe(0)  // el último elemento ya es un día real
  })

  it('celdas de relleno tienen iso=null y num=null', () => {
    const padding = grid.filter((c) => c.iso === null)
    padding.forEach((c) => {
      expect(c.num).toBeNull()
      expect(c.isToday).toBe(false)
    })
  })

  it('isToday=true solo en la celda de HOY_ISO', () => {
    const todayCells = grid.filter((c) => c.isToday)
    expect(todayCells).toHaveLength(1)
    expect(todayCells[0].iso).toBe(HOY_ISO)
  })

  it('un mes que termina en sábado genera 1 celda de relleno al final', () => {
    // Octubre 2026: empieza jueves 1, termina sábado 31 → endPad = 1
    const oct = buildMonthGrid('2026-10-15')
    const real = oct.filter((c) => c.iso !== null)
    expect(real).toHaveLength(31)
    expect(oct.length % 7).toBe(0)
    // El último elemento debe ser una celda de relleno
    expect(oct[oct.length - 1].iso).toBeNull()
  })
})

// ── monthName ─────────────────────────────────────────────────────────────────
describe('monthName', () => {
  const cases: [string, string][] = [
    ['2026-01-15', 'enero'],
    ['2026-05-08', 'mayo'],
    ['2026-12-31', 'diciembre'],
  ]
  cases.forEach(([iso, expected]) => {
    it(`"${iso}" → "${expected}"`, () => {
      expect(monthName(iso)).toBe(expected)
    })
  })
})

// ── yearOf ────────────────────────────────────────────────────────────────────
describe('yearOf', () => {
  it('extrae el año correctamente', () => {
    expect(yearOf('2026-05-08')).toBe(2026)
    expect(yearOf('2000-01-01')).toBe(2000)
  })
})
