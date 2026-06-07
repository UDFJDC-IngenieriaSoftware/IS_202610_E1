import { test as base, expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { BARBERO_CREDENTIALS, API_BASE } from './auth.fixture'

type ApiFixtures = {
  /** APIRequestContext pre-autenticado con el JWT del barbero de prueba */
  authedRequest: APIRequestContext
}

/**
 * test extendido para specs de API (tests/e2e/api/*.spec.ts).
 *
 * Uso:
 *   import { test, expect } from '../fixtures/api.fixture'
 *
 *   test('GET /api/servicios devuelve lista', async ({ authedRequest }) => {
 *     const res = await authedRequest.get('/api/servicios')
 *     expect(res.status()).toBe(200)
 *   })
 */
export const test = base.extend<ApiFixtures>({
  authedRequest: async ({ playwright }, use) => {
    // 1. Crear contexto base apuntando al backend
    const ctx = await playwright.request.newContext({ baseURL: API_BASE })

    // 2. Login — el backend responde con cookie HttpOnly + token en body
    const loginRes = await ctx.post('/api/auth/login', {
      data: {
        email: BARBERO_CREDENTIALS.email,
        password: BARBERO_CREDENTIALS.password,
      },
    })
    expect(
      loginRes.status(),
      `Setup: login de barbero de prueba falló (${loginRes.status()})`,
    ).toBe(200)

    const body = await loginRes.json()
    const token: string = body.token ?? ''

    // 3. Crear contexto definitivo: cookies del login + Bearer como respaldo
    const authed = await playwright.request.newContext({
      baseURL: API_BASE,
      storageState: await ctx.storageState(), // cookies HttpOnly del login
      extraHTTPHeaders: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    })

    await ctx.dispose()
    await use(authed)
    await authed.dispose()
  },
})

export { expect }
