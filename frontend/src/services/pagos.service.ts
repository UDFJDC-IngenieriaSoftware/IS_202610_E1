import type { Pago, EstadoPago } from '../types'
import { USE_MOCKS, mockDelay, request } from './apiClient'
import { PAGOS_MOCK } from './mocks/pagos.mock'

export async function listPagos(): Promise<Pago[]> {
  if (USE_MOCKS) return mockDelay([...PAGOS_MOCK])
  return request<Pago[]>('/admin/pagos')
}

export async function listPagosByBarbero(barberoId: string): Promise<Pago[]> {
  if (USE_MOCKS) {
    return mockDelay([...PAGOS_MOCK].filter((p) => p.barberoId === barberoId))
  }
  return request<Pago[]>(`/admin/pagos?barberoId=${barberoId}`)
}

export async function updateEstadoPago(
  id: string,
  estado: EstadoPago,
): Promise<Pago> {
  if (USE_MOCKS) {
    const pago = PAGOS_MOCK.find((p) => p.id === id)
    if (!pago) throw new Error(`Pago ${id} no encontrado`)
    return mockDelay({ ...pago, estado })
  }
  return request<Pago>(`/admin/pagos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}
