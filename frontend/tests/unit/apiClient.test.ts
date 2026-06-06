import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDelay, register401Handler } from '../../src/services/apiClient'

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('mockDelay', () => {
    it('should return a promise that resolves with the provided value', async () => {
      const value = { test: 'data' }
      const result = await mockDelay(value, 10)
      expect(result).toEqual(value)
    })

    it('should return a promise with default delay of 120ms', async () => {
      const start = Date.now()
      await mockDelay('test')
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(110)
    })

    it('should use custom delay when provided', async () => {
      const start = Date.now()
      await mockDelay('test', 50)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(40)
    })

    it('should handle objects', async () => {
      const obj = { key: 'value', number: 42 }
      const result = await mockDelay(obj, 10)
      expect(result).toEqual(obj)
    })

    it('should handle arrays', async () => {
      const arr = [1, 2, 3]
      const result = await mockDelay(arr, 10)
      expect(result).toEqual(arr)
    })
  })

  describe('register401Handler', () => {
    it('should register a 401 handler function', () => {
      const handler = vi.fn()
      expect(() => register401Handler(handler)).not.toThrow()
    })

    it('should accept null to clear handler', () => {
      expect(() => register401Handler(null as any)).not.toThrow()
    })

    it('should allow registering multiple handlers (last wins)', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      register401Handler(handler1)
      register401Handler(handler2)

      expect(() => register401Handler(handler2)).not.toThrow()
    })
  })
})
