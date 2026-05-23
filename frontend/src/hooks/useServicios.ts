/**
 * Hook de servicios que envuelve useAsync + servicios.service.
 */
import { useAsync } from './useAsync'
import { listServicios } from '../services/servicios.service'

export function useServicios() {
  return useAsync(() => listServicios(), [])
}
