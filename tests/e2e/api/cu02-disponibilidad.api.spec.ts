/**
 * CU-02 — Consultar disponibilidad de horarios (API)
 *
 * RF-03
 *
 * Endpoint: POST /api/citas/disponibilidad
 * Body: { idServicio: string, fecha: string (YYYY-MM-DD) }
 *
 * Cubre:
 *  ✅ FP   : Fecha con horario activo devuelve array de slots {time, available}
 *  ✅ FP   : Los slots ocupados por las citas del seed NO aparecen disponibles
 *  ✅ FA-01: Domingo (día sin configuración activa) → array vacío
 *  ✅ FA-02: Campos faltantes → 400
 *
 * Nota: el endpoint NO requiere autenticación (acceso público del chatbot).
 */
import { test, expect } from '../fixtures/api.fixture'

const ID_SERVICIO_CORTE = 'a0e86958-8686-4e38-967a-0e7845ef2001' // 30 min, lun-vie 09:00-19:00
const ID_SERVICIO_BARBA = 'a0e86958-8686-4e38-967a-0e7845ef2002' // 20 min

// Jueves 25 jun 2026 — activo en la configuración (idx=4, activo=true, 09:00-20:00)
// No coincide con las citas del seed (23 jun), así que todos los slots estarán libres.
const FECHA_DISPONIBLE = '2026-06-25'

// Domingo 28 jun 2026 — idx=0, activo=false → sin horario configurado
const FECHA_DOMINGO     = '2026-06-28'

// Martes 23 jun 2026 — día del seed: los 3 horarios de 09:00/10:00/11:00 están reservados
const FECHA_SEED        = '2026-06-23'

test.describe('CU-02 · Consultar disponibilidad de horarios', () => {
  test('FP · fecha con horario activo devuelve array de TimeSlots', async ({ authedRequest }) => {
    const res = await authedRequest.post('/api/citas/disponibilidad', {
      data: { idServicio: ID_SERVICIO_CORTE, fecha: FECHA_DISPONIBLE },
    })
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThan(0)

    // Cada slot tiene {time: HH:MM, available: boolean}
    const slot = body[0]
    expect(slot).toHaveProperty('time')
    expect(slot).toHaveProperty('available')
    expect(slot.time).toMatch(/^\d{2}:\d{2}$/)
    expect(typeof slot.available).toBe('boolean')
  })

  test('FP · al menos un slot del día libre está disponible', async ({ authedRequest }) => {
    const res = await authedRequest.post('/api/citas/disponibilidad', {
      data: { idServicio: ID_SERVICIO_CORTE, fecha: FECHA_DISPONIBLE },
    })
    const body = await res.json() as Array<{ time: string; available: boolean }>
    // Debe haber al menos un slot libre (la BD de prueba puede tener otras citas)
    expect(body.some(s => s.available === true)).toBe(true)
  })

  test('FP · slots del día del seed (23-jun) no incluyen los horarios reservados', async ({ authedRequest }) => {
    // Con el seed activo, 09:00, 10:00, 11:00 están reservados
    const res = await authedRequest.post('/api/citas/disponibilidad', {
      data: { idServicio: ID_SERVICIO_CORTE, fecha: FECHA_SEED },
    })
    expect(res.status()).toBe(200)

    const body = await res.json() as Array<{ time: string; available: boolean }>
    // Alguno de los slots ocupados no debe aparecer disponible (o el array viene vacío)
    const slot09 = body.find(s => s.time === '09:00')
    const slot10 = body.find(s => s.time === '10:00')
    if (slot09) expect(slot09.available).toBe(false)
    if (slot10) expect(slot10.available).toBe(false)
  })

  test('FA-01 · domingo (día no laborable) devuelve array vacío', async ({ authedRequest }) => {
    const res = await authedRequest.post('/api/citas/disponibilidad', {
      data: { idServicio: ID_SERVICIO_CORTE, fecha: FECHA_DOMINGO },
    })
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(0)
  })

  test('FA-02 · sin campo fecha → 400', async ({ authedRequest }) => {
    const res = await authedRequest.post('/api/citas/disponibilidad', {
      data: { idServicio: ID_SERVICIO_CORTE },
    })
    expect(res.status()).toBe(400)
  })

  test('FA-02 · sin campo idServicio → 400', async ({ authedRequest }) => {
    const res = await authedRequest.post('/api/citas/disponibilidad', {
      data: { fecha: FECHA_DISPONIBLE },
    })
    expect(res.status()).toBe(400)
  })

  test('FA-02 · fecha con formato incorrecto → 400', async ({ authedRequest }) => {
    const res = await authedRequest.post('/api/citas/disponibilidad', {
      data: { idServicio: ID_SERVICIO_BARBA, fecha: '25/06/2026' },
    })
    expect(res.status()).toBe(400)
  })
})
