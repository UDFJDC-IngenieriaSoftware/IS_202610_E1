/**
 * Handlers de MSW para los tests de integración.
 * Simulan las respuestas del backend sin tocar la red real.
 */
import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:3000'

export const handlers = [
  // ── Auth ──────────────────────────────────────────────────────────────────
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({
      perfil: {
        id: 'b001',
        nombre: 'Test User',
        barberia: 'Test Barbería',
        ciudad: 'Bogotá',
        inicial: 'TU',
      },
      rol: 'barbero',
    }),
  ),

  http.post(`${BASE}/auth/logout`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${BASE}/auth/me`, () =>
    new HttpResponse(null, { status: 401 }),
  ),
]
