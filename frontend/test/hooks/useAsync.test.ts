/**
 * Tests de src/hooks/useAsync.ts
 * Cubre: estado inicial, resolución exitosa, errores, refetch y cancelación.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAsync } from '../../src/hooks/useAsync'

describe('useAsync', () => {
  it('empieza con loading=true y data/error en null', () => {
    // Promise que nunca resuelve para observar el estado inicial
    const { result } = renderHook(() =>
      useAsync(() => new Promise(() => {})),
    )

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('resuelve data correctamente y pone loading=false', async () => {
    const { result } = renderHook(() =>
      useAsync(() => Promise.resolve('hola mundo')),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toBe('hola mundo')
    expect(result.current.error).toBeNull()
  })

  it('resuelve objetos complejos', async () => {
    const payload = { id: 1, nombre: 'Test' }
    const { result } = renderHook(() =>
      useAsync(() => Promise.resolve(payload)),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(payload)
  })

  it('captura Error y expone su mensaje', async () => {
    const { result } = renderHook(() =>
      useAsync(() => Promise.reject(new Error('algo falló'))),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('algo falló')
  })

  it('captura valores no-Error y usa "Error desconocido"', async () => {
    const { result } = renderHook(() =>
      useAsync(() => Promise.reject('string error')),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Error desconocido')
  })

  it('refetch vuelve a loading=true y re-ejecuta fn', async () => {
    let calls = 0
    const { result } = renderHook(() =>
      useAsync(() => Promise.resolve(++calls)),
    )

    await waitFor(() => expect(result.current.data).toBe(1))

    act(() => { result.current.refetch() })

    // Durante el refetch vuelve a loading
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.data).toBe(2))
    expect(result.current.loading).toBe(false)
  })

  it('pasa AbortSignal al fn', async () => {
    const fn = vi.fn((_signal: AbortSignal) => Promise.resolve('ok'))
    const { result } = renderHook(() => useAsync(fn))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fn).toHaveBeenCalledOnce()
    expect(fn.mock.calls[0][0]).toBeInstanceOf(AbortSignal)
  })

  it('no actualiza el estado después de desmontar (evita memory leaks)', async () => {
    // Promise que resuelve tras un tick — el componente se desmonta antes
    let resolvePromise!: (v: string) => void
    const promise = new Promise<string>((res) => { resolvePromise = res })

    const { result, unmount } = renderHook(() => useAsync(() => promise))

    // Desmontamos antes de que resuelva
    unmount()
    resolvePromise('tardío')

    // No debe lanzar errores ni cambiar estado
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
  })

  it('cancela la petición anterior al hacer refetch', async () => {
    const abortedSignals: boolean[] = []

    const fn = vi.fn((signal: AbortSignal) => {
      return new Promise<number>((resolve) => {
        // Registra si la signal fue abortada al resolver
        setTimeout(() => {
          abortedSignals.push(signal.aborted)
          resolve(1)
        }, 10)
      })
    })

    const { result } = renderHook(() => useAsync(fn))

    // Llamar refetch inmediatamente aborta la primera ejecución
    act(() => { result.current.refetch() })

    await waitFor(() => expect(result.current.data).toBe(1))

    // La primera signal debe haber sido abortada
    expect(abortedSignals[0]).toBe(true)
  })
})
