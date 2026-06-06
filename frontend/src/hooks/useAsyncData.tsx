/**
 * Hook para manejar estados de carga/error/data de forma consistente
 *
 * Uso:
 * ```typescript
 * const { data, loading, error, refetch } = useAsyncData(
 *   () => fetch('/api/data').then(r => r.json())
 * )
 * ```
 */

import { useState, useEffect, useCallback } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  useEffect(() => {
    refetch()
  }, dependencies)

  return { data, loading, error, refetch }
}

// Componentes reutilizables para estados comunes

export function LoadingSpinner() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div className="spinner" />
      <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>Cargando...</p>
    </div>
  )
}

export function ErrorAlert({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{
      padding: '1rem',
      backgroundColor: 'var(--error-bg)',
      border: '1px solid var(--error)',
      borderRadius: '0.5rem',
      color: 'var(--error)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span>❌ {message}</span>
      {onRetry && (
        <button onClick={onRetry} style={{ marginLeft: '1rem' }}>
          Reintentar
        </button>
      )}
    </div>
  )
}

export function EmptyState({ message = 'Sin resultados' }: { message?: string }) {
  return (
    <div style={{
      padding: '3rem 1rem',
      textAlign: 'center',
      color: 'var(--muted)',
    }}>
      <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📭</p>
      <p>{message}</p>
    </div>
  )
}
