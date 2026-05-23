/**
 * Tests de src/hooks/useDebounce.ts
 * Usa fake timers para controlar el paso del tiempo.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../../src/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('devuelve el valor inicial inmediatamente', () => {
    const { result } = renderHook(() => useDebounce('hola', 250))
    expect(result.current).toBe('hola')
  })

  it('no actualiza antes de que pase el delay', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 250),
      { initialProps: { value: 'a' } },
    )

    rerender({ value: 'b' })
    act(() => { vi.advanceTimersByTime(100) })

    expect(result.current).toBe('a')
  })

  it('actualiza exactamente al cumplirse el delay', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 250),
      { initialProps: { value: 'a' } },
    )

    rerender({ value: 'b' })
    act(() => { vi.advanceTimersByTime(250) })

    expect(result.current).toBe('b')
  })

  it('solo usa el último valor cuando hay actualizaciones rápidas (debounce real)', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 250),
      { initialProps: { value: 'a' } },
    )

    rerender({ value: 'b' })
    act(() => { vi.advanceTimersByTime(100) })

    rerender({ value: 'c' })
    act(() => { vi.advanceTimersByTime(100) })

    rerender({ value: 'd' })
    act(() => { vi.advanceTimersByTime(250) })

    expect(result.current).toBe('d')
  })

  it('respeta un delay personalizado', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 500),
      { initialProps: { value: 'x' } },
    )

    rerender({ value: 'y' })
    act(() => { vi.advanceTimersByTime(499) })
    expect(result.current).toBe('x')

    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe('y')
  })

  it('funciona con tipos numéricos', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useDebounce(value, 100),
      { initialProps: { value: 1 } },
    )

    rerender({ value: 42 })
    act(() => { vi.advanceTimersByTime(100) })

    expect(result.current).toBe(42)
  })
})
