import type { HorarioDia, DiaLibre } from '../types'
import { USE_MOCKS, mockDelay, request } from './apiClient'
import { HORARIO_MOCK, DIAS_LIBRES_MOCK } from './mocks/horario.mock'

export async function getHorario(): Promise<HorarioDia[]> {
  if (USE_MOCKS) return mockDelay([...HORARIO_MOCK])
  return request<HorarioDia[]>('/horario')
}

export async function updateHorarioDia(
  idx: number,
  data: Partial<Omit<HorarioDia, 'dia' | 'idx'>>,
): Promise<HorarioDia> {
  if (USE_MOCKS) {
    const dia = HORARIO_MOCK.find((h) => h.idx === idx)
    if (!dia) throw new Error(`Día con idx ${idx} no encontrado`)
    return mockDelay({ ...dia, ...data })
  }
  return request<HorarioDia>(`/horario/${idx}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function getDiasLibres(): Promise<DiaLibre[]> {
  if (USE_MOCKS) return mockDelay([...DIAS_LIBRES_MOCK])
  return request<DiaLibre[]>('/horario/dias-libres')
}

export async function addDiaLibre(
  data: Omit<DiaLibre, 'id'>,
): Promise<DiaLibre> {
  if (USE_MOCKS) {
    return mockDelay({ ...data, id: `d${Date.now()}` })
  }
  return request<DiaLibre>('/horario/dias-libres', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function removeDiaLibre(id: string): Promise<void> {
  if (USE_MOCKS) return mockDelay(undefined)
  return request<void>(`/horario/dias-libres/${id}`, { method: 'DELETE' })
}
