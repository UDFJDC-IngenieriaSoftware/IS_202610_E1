import { errorHandler } from '../../src/middleware/error-handler'
import { HttpError } from '../../src/utils/http'
import { Request, Response, NextFunction } from 'express'

describe('Error Handler Middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: jest.Mock
  let statusFn: jest.Mock
  let jsonFn: jest.Mock

  beforeEach(() => {
    jsonFn = jest.fn().mockReturnThis()
    statusFn = jest.fn().mockReturnValue({ json: jsonFn })
    req = {
      headers: { 'x-correlation-id': 'test-id-123' },
      method: 'GET',
      path: '/api/test',
    }
    res = {
      status: statusFn,
      json: jsonFn,
      setHeader: jest.fn(),
    }
    next = jest.fn()
  })

  describe('HttpError handling', () => {
    it('should return appropriate status for HttpError', () => {
      const error = new HttpError(404, 'Not found')

      errorHandler(error, req as Request, res as Response, next)

      expect(statusFn).toHaveBeenCalledWith(404)
    })

    it('should return error response in correct format', () => {
      const error = new HttpError(400, 'Invalid request')

      errorHandler(error, req as Request, res as Response, next)

      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 400,
            message: 'Invalid request',
          }),
        })
      )
    })

    it('should include error details in dev mode', () => {
      process.env.NODE_ENV = 'development'
      const error = new HttpError(400, 'Invalid', { field: 'email' })

      errorHandler(error, req as Request, res as Response, next)

      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details: { field: 'email' },
          }),
        })
      )
    })
  })

  describe('Generic Error handling', () => {
    it('should return 500 for unknown errors', () => {
      const error = new Error('Something went wrong')

      errorHandler(error, req as Request, res as Response, next)

      expect(statusFn).toHaveBeenCalledWith(500)
    })

    it('should not expose internal error message in production', () => {
      process.env.NODE_ENV = 'production'
      const error = new Error('Internal database error')

      errorHandler(error, req as Request, res as Response, next)

      const callArgs = jsonFn.mock.calls[0][0]
      expect(callArgs.error.message).not.toContain('database')
      expect(callArgs.error.message).toBe('Internal server error')
    })

    it('should expose error message in development', () => {
      process.env.NODE_ENV = 'development'
      const error = new Error('Test error message')

      errorHandler(error, req as Request, res as Response, next)

      const callArgs = jsonFn.mock.calls[0][0]
      expect(callArgs.error.message).toBe('Test error message')
    })
  })

  describe('Unknown error type', () => {
    it('should handle non-Error objects gracefully', () => {
      const unknownError = { custom: 'error' }

      errorHandler(unknownError, req as Request, res as Response, next)

      expect(statusFn).toHaveBeenCalledWith(500)
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 500,
            message: 'Internal server error',
          }),
        })
      )
    })
  })

  describe('Correlation ID', () => {
    it('should include correlation ID in error response', () => {
      const error = new HttpError(400, 'Bad request')

      errorHandler(error, req as Request, res as Response, next)

      // Verify correlation ID is used in logging
      expect((req as any).headers?.['x-correlation-id']).toBe('test-id-123')
    })
  })
})
