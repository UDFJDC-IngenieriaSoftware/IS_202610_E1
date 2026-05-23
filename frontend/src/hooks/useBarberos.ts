import { useAsync } from './useAsync'
import { listBarberos, listPlanes, getMetricas } from '../services/barberos.service'

export function useBarberos() {
  return useAsync(() => listBarberos(), [])
}

export function usePlanes() {
  return useAsync(() => listPlanes(), [])
}

export function useMetricas() {
  return useAsync(() => getMetricas(), [])
}
