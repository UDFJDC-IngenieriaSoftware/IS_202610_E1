/**
 * useAsync — patrón loading / data / error reutilizable.
 * Cancela la actualización de estado si el componente se desmonta.
 */
import { useState, useEffect, useCallback, useRef } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  })
  const mountedRef = useRef(true)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    mountedRef.current = true
    setState((s) => ({ ...s, loading: true, error: null }))

    fn()
      .then((data) => {
        if (mountedRef.current) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (mountedRef.current)
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Error desconocido',
          })
      })

    return () => {
      mountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { ...state, refetch }
}
