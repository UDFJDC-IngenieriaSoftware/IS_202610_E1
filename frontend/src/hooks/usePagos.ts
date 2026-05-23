import { useAsync } from './useAsync'
import { listPagos, listPagosByBarbero } from '../services/pagos.service'

export function usePagos() {
  return useAsync(() => listPagos(), [])
}

export function usePagosByBarbero(barberoId: string) {
  return useAsync(() => listPagosByBarbero(barberoId), [barberoId])
}
