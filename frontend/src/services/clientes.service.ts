import type { ClienteConStats } from '../types'
import { USE_MOCKS, mockDelay, request } from './apiClient'
import { CLIENTES_MOCK } from './mocks/clientes.mock'

export async function listClientes(busqueda?: string): Promise<ClienteConStats[]> {
  if (USE_MOCKS) {
    const all = [...CLIENTES_MOCK]
    if (!busqueda) return mockDelay(all)
    const q = busqueda.toLowerCase()
    return mockDelay(
      all.filter(
        (c) =>
          `${c.nombres} ${c.apellidos}`.toLowerCase().includes(q) ||
          c.celular.includes(q) ||
          c.email.toLowerCase().includes(q),
      ),
    )
  }
  const qs = busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : ''
  return request<ClienteConStats[]>(`/clientes${qs}`)
}

export async function getCliente(id: string): Promise<ClienteConStats> {
  if (USE_MOCKS) {
    const found = CLIENTES_MOCK.find((c) => c.id === id)
    if (!found) throw new Error(`Cliente ${id} no encontrado`)
    return mockDelay({ ...found })
  }
  return request<ClienteConStats>(`/clientes/${id}`)
}

export async function updateCliente(
  id: string,
  data: Partial<Pick<ClienteConStats, 'nombres' | 'apellidos' | 'email'>>,
): Promise<ClienteConStats> {
  if (USE_MOCKS) {
    const found = CLIENTES_MOCK.find((c) => c.id === id)
    if (!found) throw new Error(`Cliente ${id} no encontrado`)
    return mockDelay({ ...found, ...data })
  }
  return request<ClienteConStats>(`/clientes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
