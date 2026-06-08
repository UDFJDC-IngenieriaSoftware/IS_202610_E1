/**
 * useAsync — patrón loading / data / error reutilizable.
 *
 * - Estado inicial: loading=true (cubre la primera carga sin setState síncrono en effect).
 * - refetch(): resetea a loading=true desde el event handler (no desde el effect),
 *   luego incrementa version para re-ejecutar el effect.
 * - Crea un AbortController por cada ejecución y lo cancela en el cleanup:
 *   el `fn` recibe el signal y puede pasarlo al fetch/request para cancelar
 *   la petición de red en lugar de solo ignorar el resultado.
 *
 * Firma de `fn`: (signal: AbortSignal) => Promise<T>
 * Las funciones con menos parámetros `() => ...` también son válidas en TS.
 */
import { useState, useEffect, useCallback, useRef } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useAsync<T>(
  fn: (signal: AbortSignal) => Promise<T>,
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
    const controller = new AbortController()

    fn(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted && mountedRef.current)
          setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        // Ignorar errores de cancelación (componente desmontado o refetch)
        if (controller.signal.aborted) return
        if (mountedRef.current)
          setState({
            data:    null,
            loading: false,
            error:   err instanceof Error ? err.message : 'Error desconocido',
          })
      })

    return () => {
      controller.abort()
      mountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  return { ...state, refetch }
}
