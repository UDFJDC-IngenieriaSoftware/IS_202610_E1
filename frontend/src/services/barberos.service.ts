import type { Barbero, Plan, MetricasPlataforma } from '../types'
import { USE_MOCKS, mockDelay, request } from './apiClient'
import { BARBEROS_MOCK, METRICAS_MOCK } from './mocks/barberos.mock'
import { PLANES_MOCK } from './mocks/planes.mock'

// ── Barberos ──────────────────────────────────────────────────────────────────

export async function listBarberos(): Promise<Barbero[]> {
  if (USE_MOCKS) return mockDelay([...BARBEROS_MOCK])
  return request<Barbero[]>('/admin/barberos')
}

export async function getBarberoById(id: string): Promise<Barbero | undefined> {
  if (USE_MOCKS) {
    return mockDelay(BARBEROS_MOCK.find((b) => b.id === id))
  }
  return request<Barbero>(`/admin/barberos/${id}`)
}

export async function updateBarbero(
  id: string,
  data: Partial<Omit<Barbero, 'id'>>,
): Promise<Barbero> {
  if (USE_MOCKS) {
    const barbero = BARBEROS_MOCK.find((b) => b.id === id)
    if (!barbero) throw new Error(`Barbero ${id} no encontrado`)
    return mockDelay({ ...barbero, ...data })
  }
  return request<Barbero>(`/admin/barberos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ── Planes ────────────────────────────────────────────────────────────────────

export async function listPlanes(): Promise<Plan[]> {
  if (USE_MOCKS) return mockDelay([...PLANES_MOCK])
  return request<Plan[]>('/admin/planes')
}

// ── Métricas ──────────────────────────────────────────────────────────────────

export async function getMetricas(): Promise<MetricasPlataforma> {
  if (USE_MOCKS) return mockDelay({ ...METRICAS_MOCK })
  return request<MetricasPlataforma>('/admin/metricas')
}
