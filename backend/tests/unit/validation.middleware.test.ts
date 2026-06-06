import { validate } from '../../src/middleware/validation'
import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'
import { HttpError } from '../../src/utils/http'

describe('Validation Middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: jest.Mock

  beforeEach(() => {
    req = { body: {}, query: {}, params: {} }
    res = {}
    next = jest.fn()
  })

  describe('validate with body', () => {
    it('should pass valid data through', () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })

      req.body = { email: 'test@example.com', password: 'password123' }

      const middleware = validate(schema, 'body')
      middleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith()
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('should reject invalid data', () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })

      req.body = { email: 'invalid-email', password: 'short' }

      const middleware = validate(schema, 'body')
      middleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(HttpError)
      expect(error.status).toBe(400)
    })

    it('should include validation errors in http error', () => {
      const schema = z.object({
        age: z.number().positive(),
      })

      req.body = { age: -5 }

      const middleware = validate(schema, 'body')
      middleware(req as Request, res as Response, next)

      const error = next.mock.calls[0][0] as HttpError
      expect(error.status).toBe(400)
      expect(error.message).toContain('age')
    })
  })

  describe('validate with query', () => {
    it('should validate query parameters', () => {
      const schema = z.object({
        page: z.string(),
      })

      req.query = { page: '1' }

      const middleware = validate(schema, 'query')
      middleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('validate with params', () => {
    it('should validate route parameters', () => {
      const schema = z.object({
        id: z.string().uuid(),
      })

      req.params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const middleware = validate(schema, 'params')
      middleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('error messages', () => {
    it('should include field path in error message', () => {
      const schema = z.object({
        user: z.object({
          email: z.string().email(),
        }),
      })

      req.body = { user: { email: 'invalid' } }

      const middleware = validate(schema, 'body')
      middleware(req as Request, res as Response, next)

      const error = next.mock.calls[0][0] as HttpError
      expect(error.message).toContain('email')
    })
  })
})
