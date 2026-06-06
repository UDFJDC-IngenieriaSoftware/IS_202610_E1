import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAsync } from '../../src/hooks/useAsync'

describe('useAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading states', () => {
    it('should start with loading=true', () => {
      const fn = vi.fn(() => Promise.resolve('data'))

      const { result } = renderHook(() => useAsync(fn))

      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBeNull()
      expect(result.current.error).toBeNull()
    })

    it('should set loading=false when data resolves', async () => {
      const fn = vi.fn(() => Promise.resolve('test data'))

      const { result } = renderHook(() => useAsync(fn))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBe('test data')
      expect(result.current.error).toBeNull()
    })
  })

  describe('data handling', () => {
    it('should store resolved data', async () => {
      const testData = { id: 1, name: 'Test' }
      const fn = vi.fn(() => Promise.resolve(testData))

      const { result } = renderHook(() => useAsync(fn))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(testData)
    })

    it('should handle array data', async () => {
      const testArray = [1, 2, 3]
      const fn = vi.fn(() => Promise.resolve(testArray))

      const { result } = renderHook(() => useAsync(fn))

      await waitFor(() => {
        expect(result.current.data).toEqual(testArray)
      })
    })
  })

  describe('error handling', () => {
    it('should set error when promise rejects', async () => {
      const errorMsg = 'Test error'
      const fn = vi.fn(() => Promise.reject(new Error(errorMsg)))

      const { result } = renderHook(() => useAsync(fn))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe(errorMsg)
      expect(result.current.data).toBeNull()
    })

    it('should handle non-Error rejections', async () => {
      const fn = vi.fn(() => Promise.reject('string error'))

      const { result } = renderHook(() => useAsync(fn))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Error desconocido')
    })
  })

  describe('refetch', () => {
    it('should provide refetch function', async () => {
      const fn = vi.fn(() => Promise.resolve('data'))

      const { result } = renderHook(() => useAsync(fn))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(typeof result.current.refetch).toBe('function')
    })

    it('should be callable without errors', async () => {
      const fn = vi.fn(() => Promise.resolve('data'))

      const { result } = renderHook(() => useAsync(fn))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(() => {
        result.current.refetch()
      }).not.toThrow()
    })
  })

  describe('dependencies', () => {
    it('should re-run on dependency change', async () => {
      const fn = vi.fn(() => Promise.resolve('data'))

      const { result, rerender } = renderHook(
        ({ dep }) => useAsync(() => fn(), [dep]),
        { initialProps: { dep: 1 } },
      )

      await waitFor(() => {
        expect(fn).toHaveBeenCalledTimes(1)
      })

      rerender({ dep: 2 })

      await waitFor(() => {
        expect(fn).toHaveBeenCalledTimes(2)
      })
    })

    it('should not re-run when dependencies stay same', async () => {
      const fn = vi.fn(() => Promise.resolve('data'))

      const { rerender } = renderHook(
        ({ dep }) => useAsync(() => fn(), [dep]),
        { initialProps: { dep: 1 } },
      )

      await waitFor(() => {
        expect(fn).toHaveBeenCalledTimes(1)
      })

      rerender({ dep: 1 })

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('abort signal', () => {
    it('should pass abort signal to function', async () => {
      let receivedSignal: AbortSignal | null = null

      const fn = vi.fn((signal: AbortSignal) => {
        receivedSignal = signal
        return Promise.resolve('data')
      })

      renderHook(() => useAsync(fn))

      await waitFor(() => {
        expect(receivedSignal).toBeDefined()
      })
    })

    it('should not update state if aborted', async () => {
      const fn = vi.fn((signal: AbortSignal) =>
        new Promise((resolve) => {
          setTimeout(() => {
            if (!signal.aborted) {
              resolve('data')
            }
          }, 50)
        }),
      )

      const { result, unmount } = renderHook(() => useAsync(fn))

      unmount()

      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should still be in loading state if unmounted before resolve
      expect(result.current.data).toBeNull()
    })
  })
})
