/**
 * apiClient — wrapper central de fetch.
 *
 * - Cuando VITE_USE_MOCKS=true (o la variable no existe en dev)
 *   los services usan mockDelay() en lugar de fetch.
 * - En producción (VITE_USE_MOCKS=false) se usa request<T>().
 */

export const USE_MOCKS: boolean =
  import.meta.env.VITE_USE_MOCKS !== 'false'

const BASE_URL: string = import.meta.env.VITE_API_URL ?? '/api'

// ── fetch real ────────────────────────────────────────────────────────────────

export async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    throw new Error(`[API] ${res.status} ${res.statusText} — ${path}`)
  }
  return res.json() as Promise<T>
}

// ── helper mocks ──────────────────────────────────────────────────────────────

/**
 * Simula latencia de red y devuelve el valor como Promise.
 * @param value  dato a envolver
 * @param ms     latencia simulada (ms)
 */
export function mockDelay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}
