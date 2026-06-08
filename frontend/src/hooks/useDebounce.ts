/**
 * useDebounce — retrasa la actualización de un valor hasta que deja
 * de cambiar durante `delay` ms. Útil para buscadores.
 */
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
