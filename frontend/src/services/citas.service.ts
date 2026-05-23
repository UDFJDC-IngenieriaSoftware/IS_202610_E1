import type { Cita, EstadoCita } from '../types'
import { USE_MOCKS, mockDelay, request } from './apiClient'
import { CITAS_MOCK } from './mocks/citas.mock'

export async function listCitasByDate(fecha: string): Promise<Cita[]> {
  if (USE_MOCKS) {
    return mockDelay([...CITAS_MOCK].filter((c) => c.fecha === fecha))
  }
  return request<Cita[]>(`/citas?fecha=${fecha}`)
}

export async function listCitasByWeek(
  isoStart: string,
  isoEnd: string,
): Promise<Cita[]> {
  if (USE_MOCKS) {
    return mockDelay(
      [...CITAS_MOCK].filter((c) => c.fecha >= isoStart && c.fecha <= isoEnd),
    )
  }
  return request<Cita[]>(`/citas?desde=${isoStart}&hasta=${isoEnd}`)
}

export async function listAllCitas(): Promise<Cita[]> {
  if (USE_MOCKS) return mockDelay([...CITAS_MOCK])
  return request<Cita[]>('/citas')
}

export async function getCitaById(id: string): Promise<Cita | undefined> {
  if (USE_MOCKS) {
    return mockDelay(CITAS_MOCK.find((c) => c.id === id))
  }
  return request<Cita>(`/citas/${id}`)
}

export async function updateEstadoCita(
  id: string,
  estado: EstadoCita,
): Promise<Cita> {
  if (USE_MOCKS) {
    const cita = CITAS_MOCK.find((c) => c.id === id)
    if (!cita) throw new Error(`Cita ${id} no encontrada`)
    return mockDelay({ ...cita, estado })
  }
  return request<Cita>(`/citas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}
