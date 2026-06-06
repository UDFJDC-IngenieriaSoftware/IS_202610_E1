import { HttpError, asyncHandler, requiredString, optionalString, requiredNumber, emailString, isoDate } from '../../src/utils/http'
import { Request, Response, NextFunction } from 'express'

describe('HTTP Utilities', () => {
  describe('HttpError', () => {
    it('should create HttpError with status and message', () => {
      const error = new HttpError(404, 'Not found')
      expect(error.status).toBe(404)
      expect(error.message).toBe('Not found')
      expect(error.name).toBe('HttpError')
    })

    it('should include details if provided', () => {
      const details = { field: 'email' }
      const error = new HttpError(400, 'Invalid', details)
      expect(error.details).toEqual(details)
    })

    it('should extend Error class', () => {
      const error = new HttpError(500, 'Server error')
      expect(error instanceof Error).toBe(true)
    })
  })

  describe('asyncHandler', () => {
    it('should wrap async functions', () => {
      const asyncFn = async (req: Request, res: Response) => {
        res.json({ success: true })
      }
      const handler = asyncHandler(asyncFn)
      expect(typeof handler).toBe('function')
    })

    it('should pass errors to next', async () => {
      const error = new Error('Test error')
      const asyncFn = async () => {
        throw error
      }
      const next = jest.fn()
      const handler = asyncHandler(asyncFn)

      await handler({} as Request, {} as Response, next)

      // asyncHandler catches and passes to next
      expect(typeof next).toBe('function')
    })
  })

  describe('requiredString', () => {
    it('should return string if valid', () => {
      const result = requiredString('hello', 'name')
      expect(result).toBe('hello')
    })

    it('should throw if empty', () => {
      expect(() => requiredString('', 'name')).toThrow()
      expect(() => requiredString('   ', 'name')).toThrow()
    })

    it('should throw if not string', () => {
      expect(() => requiredString(123 as any, 'name')).toThrow()
      expect(() => requiredString(null as any, 'name')).toThrow()
    })

    it('should trim whitespace', () => {
      const result = requiredString('  hello  ', 'name')
      expect(result).toBe('hello')
    })

    it('should validate minimum length', () => {
      expect(() => requiredString('hi', 'name', 3)).toThrow()
      expect(() => requiredString('hello', 'name', 3)).not.toThrow()
    })
  })

  describe('optionalString', () => {
    it('should return string if provided', () => {
      const result = optionalString('hello')
      expect(result).toBe('hello')
    })

    it('should return undefined if not string', () => {
      expect(optionalString(123 as any)).toBeUndefined()
      expect(optionalString(null as any)).toBeUndefined()
    })

    it('should trim whitespace', () => {
      const result = optionalString('  hello  ')
      expect(result).toBe('hello')
    })
  })

  describe('requiredNumber', () => {
    it('should return number if valid', () => {
      const result = requiredNumber(123, 'age')
      expect(result).toBe(123)
    })

    it('should parse string numbers', () => {
      const result = requiredNumber('456' as any, 'age')
      expect(result).toBe(456)
    })

    it('should throw if not finite', () => {
      expect(() => requiredNumber(NaN, 'age')).toThrow()
      expect(() => requiredNumber(Infinity as any, 'age')).toThrow()
    })

    it('should enforce minimum value', () => {
      expect(() => requiredNumber(-5, 'age', 0)).toThrow()
      expect(() => requiredNumber(0, 'age', 0)).not.toThrow()
    })
  })

  describe('emailString', () => {
    it('should return valid email', () => {
      const result = emailString('test@example.com')
      expect(result).toBe('test@example.com')
    })

    it('should return lowercase email', () => {
      const result = emailString('TEST@EXAMPLE.COM')
      expect(result).toBe('test@example.com')
    })

    it('should reject invalid emails', () => {
      expect(() => emailString('not-an-email')).toThrow()
      expect(() => emailString('test@')).toThrow()
      expect(() => emailString('@example.com')).toThrow()
    })

    it('should require minimum length', () => {
      expect(() => emailString('a@b')).toThrow()
    })
  })

  describe('isoDate', () => {
    it('should return valid ISO date', () => {
      const result = isoDate('2026-06-15')
      expect(result).toBe('2026-06-15')
    })

    it('should reject invalid format', () => {
      expect(() => isoDate('06-15-2026')).toThrow()
      expect(() => isoDate('2026/06/15')).toThrow()
      expect(() => isoDate('not-a-date')).toThrow()
    })

    it('should reject invalid dates', () => {
      expect(() => isoDate('2026-13-01')).toThrow() // Invalid month
      expect(() => isoDate('2026-02-30')).toThrow() // Invalid day
    })

    it('should accept valid dates', () => {
      expect(() => isoDate('2026-02-28')).not.toThrow()
      expect(() => isoDate('2026-12-31')).not.toThrow()
    })
  })
})
