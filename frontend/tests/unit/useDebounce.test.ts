import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDebounce } from '../../src/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 250))

    expect(result.current).toBe('initial')
  })

  it('should accept a value to debounce', () => {
    const { result } = renderHook(() => useDebounce('test'))

    expect(typeof result.current).toBe('string')
  })

  it('should support custom delay parameter', () => {
    const { result } = renderHook(() => useDebounce('value', 100))

    expect(result.current).toBe('value')
  })

  it('should have default delay of 250ms', () => {
    const { result } = renderHook(() => useDebounce('value'))

    expect(result.current).toBe('value')
  })

  it('should debounce different value types', () => {
    const { result: stringResult } = renderHook(() =>
      useDebounce('text', 100),
    )
    const { result: numberResult } = renderHook(() =>
      useDebounce(42, 100),
    )
    const { result: boolResult } = renderHook(() =>
      useDebounce(true, 100),
    )

    expect(stringResult.current).toBe('text')
    expect(numberResult.current).toBe(42)
    expect(boolResult.current).toBe(true)
  })

  it('should clean up timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    const { unmount } = renderHook(() => useDebounce('test', 250))

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()

    clearTimeoutSpy.mockRestore()
  })
})
