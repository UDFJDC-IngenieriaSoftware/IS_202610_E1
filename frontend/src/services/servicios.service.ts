import type { Servicio } from '../types'
import { USE_MOCKS, mockDelay, request } from './apiClient'
import { SERVICIOS_MOCK } from './mocks/servicios.mock'

export async function listServicios(): Promise<Servicio[]> {
  if (USE_MOCKS) return mockDelay([...SERVICIOS_MOCK])
  return request<Servicio[]>('/servicios')
}

export async function listServiciosActivos(): Promise<Servicio[]> {
  if (USE_MOCKS) {
    return mockDelay([...SERVICIOS_MOCK].filter((s) => s.activo))
  }
  return request<Servicio[]>('/servicios?activo=true')
}

export async function createServicio(
  data: Omit<Servicio, 'id'>,
): Promise<Servicio> {
  if (USE_MOCKS) {
    return mockDelay({ ...data, id: `s${Date.now()}` })
  }
  return request<Servicio>('/servicios', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateServicio(
  id: string,
  data: Partial<Omit<Servicio, 'id'>>,
): Promise<Servicio> {
  if (USE_MOCKS) {
    const svc = SERVICIOS_MOCK.find((s) => s.id === id)
    if (!svc) throw new Error(`Servicio ${id} no encontrado`)
    return mockDelay({ ...svc, ...data })
  }
  return request<Servicio>(`/servicios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteServicio(id: string): Promise<void> {
  if (USE_MOCKS) return mockDelay(undefined)
  return request<void>(`/servicios/${id}`, { method: 'DELETE' })
}
