/**
 * Hooks de horario que envuelven useAsync + horario.service.
 */
import { useAsync } from './useAsync'
import { getHorario, getDiasLibres } from '../services/horario.service'

export function useHorario() {
  return useAsync(() => getHorario(), [])
}

export function useDiasLibres() {
  return useAsync(() => getDiasLibres(), [])
}
