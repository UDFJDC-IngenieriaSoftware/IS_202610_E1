/**
 * Tests de src/services/apiClient.ts
 * Usa MSW (vía test/mocks/server.ts) para interceptar fetch a nivel de Node.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { request, register401Handler } from '../../src/services/apiClient'

const BASE = 'http://localhost:3000'

describe('request()', () => {
  afterEach(() => {
    // Restaurar el handler 401 a un no-op después de cada test
    register401Handler(() => {})
  })

  it('parsea y devuelve el JSON de una respuesta 200', async () => {
    server.use(
      http.get(`${BASE}/ping`, () =>
        HttpResponse.json({ ok: true }),
      ),
    )

    const result = await request<{ ok: boolean }>('/ping')
    expect(result).toEqual({ ok: true })
  })

  it('envía credentials: "include" en cada petición', async () => {
    let capturedCredentials: RequestCredentials | undefined

    server.use(
      http.get(`${BASE}/check-creds`, ({ request: req }) => {
        capturedCredentials = req.credentials
        return HttpResponse.json({})
      }),
    )

    await request('/check-creds')
    expect(capturedCredentials).toBe('include')
  })

  it('lanza error con el texto del cuerpo en respuestas no-ok', async () => {
    server.use(
      http.get(`${BASE}/not-found`, () =>
        new HttpResponse('Recurso no encontrado', { status: 404 }),
      ),
    )

    await expect(request('/not-found')).rejects.toThrow('Recurso no encontrado')
  })

  it('incluye el status code en el mensaje de error', async () => {
    server.use(
      http.get(`${BASE}/server-error`, () =>
        new HttpResponse('Error interno', { status: 500 }),
      ),
    )

    await expect(request('/server-error')).rejects.toThrow('500')
  })

  it('llama al handler 401 registrado al recibir 401', async () => {
    const handler401 = vi.fn()
    register401Handler(handler401)

    server.use(
      http.get(`${BASE}/protected`, () =>
        new HttpResponse(null, { status: 401 }),
      ),
    )

    await expect(request('/protected')).rejects.toThrow('401')
    expect(handler401).toHaveBeenCalledOnce()
  })

  it('no llama al handler 401 en otros errores (404, 500)', async () => {
    const handler401 = vi.fn()
    register401Handler(handler401)

    server.use(
      http.get(`${BASE}/other-error`, () =>
        new HttpResponse(null, { status: 404 }),
      ),
    )

    await expect(request('/other-error')).rejects.toThrow()
    expect(handler401).not.toHaveBeenCalled()
  })

  it('envía headers Content-Type: application/json', async () => {
    let capturedContentType: string | null = null

    server.use(
      http.post(`${BASE}/data`, ({ request: req }) => {
        capturedContentType = req.headers.get('content-type')
        return HttpResponse.json({ received: true })
      }),
    )

    await request('/data', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
    })

    expect(capturedContentType).toContain('application/json')
  })

  it('permite sobreescribir headers', async () => {
    let capturedAccept: string | null = null

    server.use(
      http.get(`${BASE}/custom`, ({ request: req }) => {
        capturedAccept = req.headers.get('accept')
        return HttpResponse.json({})
      }),
    )

    await request('/custom', {
      headers: { Accept: 'text/plain' },
    })

    expect(capturedAccept).toBe('text/plain')
  })
})
