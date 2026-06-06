import { useAsync } from './useAsync'
import { listClientes } from '../services/clientes.service'

export function useClientes(busqueda?: string) {
  return useAsync(() => listClientes(busqueda), [busqueda])
}
