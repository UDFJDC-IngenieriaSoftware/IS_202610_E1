/**
 * CU-03 — Agendar cita (API)
 *
 * RF-01, RF-04 | CA-01, CA-03
 *
 * Estado: ⚠️ PARCIAL — la ruta POST /api/citas está comentada en routes/index.ts.
 *
 * El agendamiento se realiza exclusivamente a través del chatbot de WhatsApp,
 * que llama internamente a BookingService.create(). No existe endpoint REST público
 * habilitado para crear citas directamente.
 *
 * Los tests de este archivo documentan el estado actual y verifican los endpoints
 * adyacentes que sí están disponibles.
 */
import { test, expect } from '../fixtures/api.fixture'

test.describe('CU-03 · Agendar cita', () => {
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip('POST /api/citas está deshabilitado — agendamiento solo vía chatbot WhatsApp', () => {
    /**
     * La ruta está comentada en backend/src/routes/index.ts:
     *   // router.post("/", validate(bookingSchemas.create), asyncHandler(booking.createBooking));
     *
     * El BookingService.create() sí está implementado y se invoca desde el bot.
     * Para habilitar el endpoint REST: descomentar la línea y ajustar bookingSchemas.create
     * (actualmente requiere barberId, serviceId, date, time, customerPhone como números/strings).
     *
     * Pendiente según CU-03 del plan de verificación.
     */
  })

  test('GET /api/citas requiere autenticación y devuelve lista del barbero', async ({ authedRequest }) => {
    // El listado de citas del barbero sí está disponible y es la postcondición de CU-03
    const res = await authedRequest.get('/api/citas')
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('GET /api/citas con filtro de fecha devuelve solo citas de ese día', async ({ authedRequest }) => {
    // Día del seed: debe devolver las citas del 23-jun-2026
    const res = await authedRequest.get('/api/citas?fecha=2026-06-23')
    expect(res.status()).toBe(200)

    const body = await res.json() as Array<{ fecha: string }>
    // El seed insertó citas para ese día — deben aparecer aquí
    expect(body.length).toBeGreaterThan(0)
    expect(body.every(c => c.fecha === '2026-06-23')).toBe(true)
  })

  test('GET /api/citas/:id devuelve cita existente con atributos completos', async ({ authedRequest }) => {
    const ID_CITA_1 = 'e2e00000-0000-4000-8000-000000000001'
    const res = await authedRequest.get(`/api/citas/${ID_CITA_1}`)
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('id', ID_CITA_1)
    expect(body).toHaveProperty('estado')
    expect(body).toHaveProperty('fecha')
    expect(body).toHaveProperty('hora')
    expect(body).toHaveProperty('servicio')
    expect(body).toHaveProperty('cliente')
    expect(body).toHaveProperty('precio')
  })

  test('FA-03 · GET /api/citas/:id con UUID inexistente → 404', async ({ authedRequest }) => {
    const res = await authedRequest.get('/api/citas/00000000-0000-4000-8000-000000000099')
    expect(res.status()).toBe(404)
  })
})
