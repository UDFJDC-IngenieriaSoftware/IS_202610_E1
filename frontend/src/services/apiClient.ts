/**
 * apiClient — wrapper central de fetch.
 *
 * - Cuando VITE_USE_MOCKS=true (o la variable no existe en dev)
 *   los services usan mockDelay() en lugar de fetch.
 * - En producción (VITE_USE_MOCKS=false) se usa request<T>().
 *
 * Seguridad:
 * - credentials: 'include' → envía la cookie HttpOnly de sesión automáticamente.
 * - Interceptor 401 → llama al handler registrado (logout + redirect).
 * - AbortSignal.timeout(15 s) por defecto; se puede sobreescribir vía init.signal.
 * - Parseo seguro del cuerpo de error (texto antes de JSON).
 *
 * NOTA: Nunca añadir secretos con prefijo VITE_ al .env; son compilados al bundle.
 */

export const USE_MOCKS: boolean =
  import.meta.env.VITE_USE_MOCKS !== 'false'

const BASE_URL: string = import.meta.env.VITE_API_URL ?? '/api'

// ── interceptor 401 ───────────────────────────────────────────────────────────

/** Handler invocado cuando el servidor responde 401 (sesión expirada). */
let _on401Handler: (() => void) | null = null

/**
 * Registra la función que se ejecutará ante una respuesta 401.
 * Llamar desde AuthProvider una vez que `logout` esté disponible.
 */
export function register401Handler(handler: () => void): void {
  _on401Handler = handler
}

// ── fetch real ────────────────────────────────────────────────────────────────

export async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  // Timeout de 15 s salvo que el llamador pase su propio signal
  const signal = (init?.signal as AbortSignal | undefined)
    ?? AbortSignal.timeout(15_000)

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',                        // envía cookie HttpOnly
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
    signal,
  })

  if (res.status === 401) {
    _on401Handler?.()
    throw new Error('[API] 401 — sesión expirada o no autorizado')
  }

  if (!res.ok) {
    // Leer el cuerpo como texto para incluir el mensaje del backend
    const body = await res.text().catch(() => '')
    throw new Error(
      `[API] ${res.status} ${res.statusText} — ${path}${body ? `: ${body}` : ''}`,
    )
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
