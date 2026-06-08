import { requireAuth, requireAdmin } from '../../src/middleware/auth'
import { HttpError } from '../../src/utils/http'

jest.mock('../../src/services/auth.service', () => ({
  verifyToken: jest.fn(),
}))
jest.mock('../../src/config/env', () => ({
  env: { cookieName: 'miturno_session' },
}))

import { verifyToken } from '../../src/services/auth.service'

const mockVerify = verifyToken as jest.Mock

describe('auth.middleware', () => {
  const mockRes = {} as any
  const next = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  describe('requireAuth', () => {
    it('attaches auth claims and calls next for valid Bearer token', () => {
      const claims = { sub: 'u1', email: 'u@test.com', rol: 'barbero', exp: 9999999999 }
      mockVerify.mockReturnValue(claims)
      const req: any = { headers: { authorization: 'Bearer valid-token' } }
      requireAuth(req, mockRes, next)
      expect(req.auth).toEqual(claims)
      expect(next).toHaveBeenCalledWith()
    })

    it('reads token from cookie when no Authorization header', () => {
      const claims = { sub: 'u1', email: 'u@test.com', rol: 'barbero', exp: 9999999999 }
      mockVerify.mockReturnValue(claims)
      const req: any = { headers: { cookie: 'miturno_session=cookie-token' } }
      requireAuth(req, mockRes, next)
      expect(mockVerify).toHaveBeenCalledWith('cookie-token')
      expect(next).toHaveBeenCalledWith()
    })

    it('passes HttpError 401 to next when no token found', () => {
      const req: any = { headers: {} }
      requireAuth(req, mockRes, next)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(HttpError)
      expect(error.status).toBe(401)
    })

    it('passes error to next when verifyToken throws', () => {
      mockVerify.mockImplementation(() => { throw new HttpError(401, 'Sesion expirada') })
      const req: any = { headers: { authorization: 'Bearer expired-token' } }
      requireAuth(req, mockRes, next)
      expect(next).toHaveBeenCalledWith(expect.any(HttpError))
    })
  })

  describe('requireAdmin', () => {
    it('calls next for admin users', () => {
      const req: any = { auth: { rol: 'admin', sub: 'a1', email: '', exp: 0 } }
      requireAdmin(req, mockRes, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('passes 403 to next for non-admin users', () => {
      const req: any = { auth: { rol: 'barbero', sub: 'b1', email: '', exp: 0 } }
      requireAdmin(req, mockRes, next)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(HttpError)
      expect(error.status).toBe(403)
    })

    it('passes 403 when auth is not set', () => {
      const req: any = {}
      requireAdmin(req, mockRes, next)
      expect(next.mock.calls[0][0].status).toBe(403)
    })
  })
})
