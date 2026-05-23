/**
 * useAsync — patrón loading / data / error reutilizable.
 *
 * - Estado inicial: loading=true (cubre la primera carga sin setState síncrono en effect).
 * - refetch(): resetea a loading=true desde el event handler (no desde el effect),
 *   luego incrementa version para re-ejecutar el effect.
 * - Cancela la actualización de estado si el componente se desmonta (flag `active`).
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
    data:    null,
    loading: true,
    error:   null,
  })
  const mountedRef = useRef(true)
  const [version, setVersion] = useState(0)

  /**
   * refetch() se llama desde manejadores de evento (no desde un effect),
   * por lo que setState aquí no viola react-hooks/set-state-in-effect.
   */
  const refetch = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    setVersion((v) => v + 1)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    let active = true

    fn()
      .then((data) => {
        if (active && mountedRef.current)
          setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (active && mountedRef.current)
          setState({
            data:    null,
            loading: false,
            error:   err instanceof Error ? err.message : 'Error desconocido',
          })
      })

    return () => {
      active = false
      mountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  return { ...state, refetch }
}
