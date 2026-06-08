import type { Pago, EstadoPago, PagoBooking } from '../types'
import { USE_MOCKS, mockDelay, request } from './apiClient'
import { PAGOS_MOCK } from './mocks/pagos.mock'
import { CITA_PAGOS_MOCK } from './mocks/cita-pagos.mock'

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

export async function listCitaPagos(desde?: string, hasta?: string): Promise<PagoBooking[]> {
  if (USE_MOCKS) {
    let data = [...CITA_PAGOS_MOCK]
    if (desde) data = data.filter((p) => p.fecha >= desde)
    if (hasta) data = data.filter((p) => p.fecha <= hasta)
    return mockDelay(data)
  }
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  const qs = params.toString()
  return request<PagoBooking[]>(`/pagos${qs ? `?${qs}` : ''}`)
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
