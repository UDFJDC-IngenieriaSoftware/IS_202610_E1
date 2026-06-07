/**
 * CU-01 — Consultar servicios disponibles (API)
 *
 * RF-02 | CA-02
 *
 * Cubre:
 *  ✅ FP   : GET /api/servicios devuelve lista con atributos requeridos
 *  ✅ FP   : Filtro ?activo=true devuelve solo servicios activos
 *  ✅ FP   : GET /api/servicios/:id devuelve un servicio concreto
 *  ✅ FA-01: Servicio inexistente → 404
 *  ✅ SEC  : Endpoint requiere autenticación → 401 sin token
 */
import { test, expect } from '../fixtures/api.fixture'

const ID_SERVICIO_CORTE = 'a0e86958-8686-4e38-967a-0e7845ef2001' // Corte Premium (30 min, 25000)
const ID_SERVICIO_BARBA = 'a0e86958-8686-4e38-967a-0e7845ef2002' // Barba y Toalla (20 min, 15000)

test.describe('CU-01 · Consultar servicios disponibles', () => {
  test('GET /api/servicios devuelve lista con nombre, precio, duracion y activo', async ({ authedRequest }) => {
    const res = await authedRequest.get('/api/servicios')
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThan(0)

    // Cada item debe tener los campos requeridos por el chatbot
    const item = body[0]
    expect(item).toHaveProperty('id')
    expect(item).toHaveProperty('nombre')
    expect(item).toHaveProperty('precio')
    expect(item).toHaveProperty('duracion')
    expect(item).toHaveProperty('activo')
  })

  test('los servicios del seed tienen precio y duración correctos', async ({ authedRequest }) => {
    const res = await authedRequest.get('/api/servicios')
    const body = await res.json() as Array<{ id: string; nombre: string; precio: number; duracion: number }>

    const corte = body.find(s => s.id === ID_SERVICIO_CORTE)
    expect(corte).toBeDefined()
    expect(corte!.precio).toBe(25000)
    expect(corte!.duracion).toBe(30)

    const barba = body.find(s => s.id === ID_SERVICIO_BARBA)
    expect(barba).toBeDefined()
    expect(barba!.precio).toBe(15000)
    expect(barba!.duracion).toBe(20)
  })

  test('GET /api/servicios?activo=true devuelve solo servicios activos', async ({ authedRequest }) => {
    const res = await authedRequest.get('/api/servicios?activo=true')
    expect(res.status()).toBe(200)

    const body = await res.json() as Array<{ activo: boolean }>
    expect(body.every(s => s.activo === true)).toBe(true)
  })

  test('GET /api/servicios/:id devuelve el servicio concreto', async ({ authedRequest }) => {
    const res = await authedRequest.get(`/api/servicios/${ID_SERVICIO_CORTE}`)
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body.id).toBe(ID_SERVICIO_CORTE)
    expect(body.nombre).toMatch(/Corte/i)
  })

  test('FA-01 · GET /api/servicios/:id con UUID inexistente → 404', async ({ authedRequest }) => {
    const res = await authedRequest.get('/api/servicios/00000000-0000-4000-8000-000000000000')
    expect(res.status()).toBe(404)
  })

  test('SEC · GET /api/servicios sin token → 401', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:3000' })
    const res = await ctx.get('/api/servicios')
    expect(res.status()).toBe(401)
    await ctx.dispose()
  })
})
