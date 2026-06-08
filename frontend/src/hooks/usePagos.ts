import { useAsync } from './useAsync'
import { listPagos, listPagosByBarbero, listCitaPagos } from '../services/pagos.service'

export function usePagos() {
  return useAsync(() => listPagos(), [])
}

export function usePagosByBarbero(barberoId: string) {
  return useAsync(() => listPagosByBarbero(barberoId), [barberoId])
}

export function useCitaPagos(desde?: string, hasta?: string) {
  return useAsync(() => listCitaPagos(desde, hasta), [desde, hasta])
}
