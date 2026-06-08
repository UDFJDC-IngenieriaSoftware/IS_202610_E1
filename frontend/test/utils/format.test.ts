/**
 * Tests de src/utils/format.ts
 * Funciones puras — sin side-effects ni dependencias de entorno.
 */
import { describe, it, expect } from 'vitest'
import {
  fmtCOP,
  fmtFechaLarga,
  fmtFechaCorta,
  fmtMesCorto,
  fmtDia,
  initials,
  truncate,
  fmtK,
} from '../../src/utils/format'

// ── fmtCOP ────────────────────────────────────────────────────────────────────
describe('fmtCOP', () => {
  it('prefija con "$"', () => {
    expect(fmtCOP(1000)).toMatch(/^\$/)
  })

  it('formatea cero', () => {
    expect(fmtCOP(0)).toMatch(/^\$0/)
  })

  it('incluye los dígitos del número', () => {
    // Verificamos que los dígitos estén presentes sin asumir separadores de locale
    expect(fmtCOP(28000)).toContain('28')
    expect(fmtCOP(28000)).toContain('000')
  })
})

// ── fmtFechaLarga ─────────────────────────────────────────────────────────────
describe('fmtFechaLarga', () => {
  it('2026-05-08 es viernes 8 de mayo', () => {
    expect(fmtFechaLarga('2026-05-08')).toBe('viernes 8 de mayo')
  })

  it('2026-01-01 es jueves 1 de enero', () => {
    expect(fmtFechaLarga('2026-01-01')).toBe('jueves 1 de enero')
  })

  it('2026-12-25 es viernes 25 de diciembre', () => {
    expect(fmtFechaLarga('2026-12-25')).toBe('viernes 25 de diciembre')
  })
})

// ── fmtFechaCorta ─────────────────────────────────────────────────────────────
describe('fmtFechaCorta', () => {
  it('formatea como dd/mm/yyyy con ceros', () => {
    expect(fmtFechaCorta('2026-05-08')).toBe('08/05/2026')
  })

  it('formatea fechas de enero con cero', () => {
    expect(fmtFechaCorta('2026-01-01')).toBe('01/01/2026')
  })

  it('formatea días de dos dígitos', () => {
    expect(fmtFechaCorta('2026-12-31')).toBe('31/12/2026')
  })
})

// ── fmtMesCorto ───────────────────────────────────────────────────────────────
describe('fmtMesCorto', () => {
  it('mayo → "May" (3 letras, primera mayúscula)', () => {
    expect(fmtMesCorto('2026-05-08')).toBe('May')
  })

  it('enero → "Ene"', () => {
    expect(fmtMesCorto('2026-01-15')).toBe('Ene')
  })

  it('diciembre → "Dic"', () => {
    expect(fmtMesCorto('2026-12-01')).toBe('Dic')
  })
})

// ── fmtDia ────────────────────────────────────────────────────────────────────
describe('fmtDia', () => {
  it('extrae el día sin cero inicial', () => {
    expect(fmtDia('2026-05-08')).toBe('8')
    expect(fmtDia('2026-05-01')).toBe('1')
    expect(fmtDia('2026-12-31')).toBe('31')
  })
})

// ── initials ─────────────────────────────────────────────────────────────────
describe('initials', () => {
  it('toma la primera letra de cada palabra para nombres compuestos', () => {
    expect(initials('Andrés Mejía')).toBe('AM')
  })

  it('toma las dos primeras letras para nombres de una sola palabra', () => {
    expect(initials('Felipe')).toBe('FE')
  })

  it('devuelve mayúsculas', () => {
    expect(initials('andrés mejía')).toBe('AM')
  })

  it('maneja espacios extra al inicio/fin', () => {
    expect(initials('  Carlos  López  ')).toBe('CL')
  })
})

// ── truncate ──────────────────────────────────────────────────────────────────
describe('truncate', () => {
  it('no trunca si el texto cabe', () => {
    expect(truncate('hola', 10)).toBe('hola')
  })

  it('trunca y añade "…" cuando supera el límite', () => {
    expect(truncate('hello world', 5)).toBe('hell…')
  })

  it('texto igual al límite no se trunca', () => {
    expect(truncate('exact', 5)).toBe('exact')
  })

  it('trunca a 1 carácter + ellipsis', () => {
    expect(truncate('ab', 2)).toBe('ab')
    expect(truncate('abc', 2)).toBe('a…')
  })
})

// ── fmtK ─────────────────────────────────────────────────────────────────────
describe('fmtK', () => {
  it('valores < 1000 usan fmtCOP', () => {
    const result = fmtK(500)
    expect(result).toMatch(/^\$/)
    expect(result).toContain('500')
  })

  it('valores >= 1000 se muestran en "k"', () => {
    expect(fmtK(826000)).toBe('$826k')
    expect(fmtK(1000)).toBe('$1k')
  })

  it('valores >= 1_000_000 se muestran en "M"', () => {
    expect(fmtK(9_912_000)).toBe('$9.91M')
    expect(fmtK(1_000_000)).toBe('$1.00M')
  })

  it('redondea los "k" al entero más cercano', () => {
    expect(fmtK(1_500)).toBe('$2k')
    expect(fmtK(1_499)).toBe('$1k')
  })
})
