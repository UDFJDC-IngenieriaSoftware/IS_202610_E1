/**
 * Hooks de citas que envuelven useAsync + citas.service.
 */
import { useAsync } from './useAsync'
import {
  listCitasByDate,
  listCitasByWeek,
  listAllCitas,
} from '../services/citas.service'

export function useCitasByDate(fecha: string) {
  return useAsync(() => listCitasByDate(fecha), [fecha])
}

export function useCitasByWeek(isoStart: string, isoEnd: string) {
  return useAsync(() => listCitasByWeek(isoStart, isoEnd), [isoStart, isoEnd])
}

export function useAllCitas() {
  return useAsync(() => listAllCitas(), [])
}
