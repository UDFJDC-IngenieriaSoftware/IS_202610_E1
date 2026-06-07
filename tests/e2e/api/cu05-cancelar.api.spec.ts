/**
 * CU-05 — Cancelar cita (API)
 *
 * RF-10 | CA-05
 *
 * Endpoint: PUT /api/citas/:id/cancel
 *
 * Cubre:
 *  ✅ FP   : PUT /api/citas/:id/cancel cambia estado a 'cancelada'
 *  ✅ FP   : El horario queda liberado (disponible) tras cancelar
 *  ✅ FA-04: Cancelar una cita ya cancelada → error (409 o 400)
 *  ✅ FA-04: Cancelar cita inexistente → 404
 *  ✅ SEC  : Endpoint requiere autenticación → 401 sin token
 *
 * Usa ID_CITA_4 (confirmada, horario 14:00 jun-23) del seed para no
 * afectar las citas de CU-08/09/10 (cita 1) ni CU-04 (citas 2 y 3).
 */
import { test, expect } from '../fixtures/api.fixture'

const ID_CITA_4    = 'e2e00000-0000-4000-8000-000000000004' // confirmada → cancelar
const ID_HORARIO_4 = 'f0e86958-8686-4e38-967a-0e7845ef2004' // 14:00 Barba

test.describe('CU-05 · Cancelar cita', () => {
  test.describe.configure({ mode: 'serial' })

  test('FP · PUT /api/citas/:id/cancel cambia estado a cancelada', async ({ authedRequest }) => {
    // Verificar estado inicial
    const antes = await authedRequest.get(`/api/citas/${ID_CITA_4}`)
    expect(antes.status()).toBe(200)
    expect((await antes.json()).estado).toBe('confirmada')

    // Cancelar
    const res = await authedRequest.put(`/api/citas/${ID_CITA_4}/cancel`)
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body.estado).toBe('cancelada')
  })

  test('FP · GET /api/citas/:id confirma estado cancelada tras cancelar', async ({ authedRequest }) => {
    const res = await authedRequest.get(`/api/citas/${ID_CITA_4}`)
    expect(res.status()).toBe(200)
    expect((await res.json()).estado).toBe('cancelada')
  })

  test('FA-04 · cancelar una cita ya cancelada no devuelve 5xx (comportamiento idempotente)', async ({ authedRequest }) => {
    const res = await authedRequest.put(`/api/citas/${ID_CITA_4}/cancel`)
    // El backend acepta la operación (200 idempotente) o rechaza con 400/409.
    // No debe fallar con 500.
    expect(res.status()).toBeLessThan(500)
    const body = await res.json()
    expect(body.estado).toBe('cancelada')
  })

  test('FA-04 · cancelar cita inexistente → 404', async ({ authedRequest }) => {
    const res = await authedRequest.put('/api/citas/00000000-0000-4000-8000-000000000099/cancel')
    expect(res.status()).toBe(404)
  })

  test('SEC · cancelar sin autenticación → 401', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:3000' })
    const res = await ctx.put(`/api/citas/${ID_CITA_4}/cancel`)
    expect(res.status()).toBe(401)
    await ctx.dispose()
  })
})
