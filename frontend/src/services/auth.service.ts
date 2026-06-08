import type { BarberoPerfil } from '../types'
import { USE_MOCKS, mockDelay, request } from './apiClient'

// Mock del barbero autenticado (sesión simulada)
const BARBER_MOCK: BarberoPerfil = {
  id: 'b001',
  nombre: 'Andrés Mejía',
  barberia: 'Estudio Barbería · Andrés',
  ciudad: 'Medellín',
  inicial: 'AM',
  plazoCancelacion: null,
  plazoReprogramacion: null,
  mensajeBienvenida: null,
  mensajeConfirmacion: null,
  mensajeRecordatorio: null,
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  /** Token JWT — presente en mocks; en producción el backend lo envía
   *  como cookie HttpOnly y puede no aparecer en el cuerpo JSON. */
  token?: string
  perfil: BarberoPerfil
  rol: 'barbero' | 'admin'
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  if (USE_MOCKS) {
    // Simula login exitoso — rol depende del email
    const rol: 'barbero' | 'admin' = payload.email.includes('admin')
      ? 'admin'
      : 'barbero'
    return mockDelay({ token: 'mock-token-000', perfil: BARBER_MOCK, rol }, 300)
  }
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function logout(): Promise<void> {
  if (USE_MOCKS) return mockDelay(undefined)
  return request<void>('/auth/logout', { method: 'POST' })
}

export async function getMe(): Promise<BarberoPerfil | null> {
  if (USE_MOCKS) return mockDelay(BARBER_MOCK)
  try {
    return await request<BarberoPerfil>('/auth/me')
  } catch {
    return null
  }
}
