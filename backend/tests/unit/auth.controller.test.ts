import { Request } from 'express'
import { HttpError } from '../../src/utils/http'

// Variables prefixed with 'mock' are hoisted by Jest and accessible inside jest.mock factories
const mockRegister = jest.fn()
const mockLogin = jest.fn()
const mockSignToken = jest.fn(() => 'mock-jwt-token')
const mockToProfile = jest.fn((_u: any) => ({ id: 'u1', nombre: 'Carlos López', barberia: 'BC', ciudad: 'Bogotá', inicial: 'CL' }))
const mockHashPassword = jest.fn(() => 'hashed')
const mockVerifyPassword = jest.fn(() => true)

jest.mock('../../src/models', () => ({ Barbero: { findByPk: jest.fn() } }))
jest.mock('../../src/services/auth.service', () => ({
  AuthService: jest.fn(() => ({ register: mockRegister, login: mockLogin })),
  signToken: mockSignToken,
  toProfile: mockToProfile,
  hashPassword: mockHashPassword,
  verifyPassword: mockVerifyPassword,
}))
jest.mock('../../src/config/env', () => ({
  env: { cookieName: 'miturno_session', jwtExpiresSeconds: 3600, nodeEnv: 'test' },
}))

import * as authController from '../../src/controllers/auth.controller'
import { Barbero } from '../../src/models'

function mockRes() {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.cookie = jest.fn().mockReturnValue(res)
  res.clearCookie = jest.fn().mockReturnValue(res)
  return res
}

const mockBarbero = {
  id: 'u1', nombres: 'Carlos', apellidos: 'López',
  email: 'carlos@test.com', rol: 'barbero', activo: true,
  update: jest.fn().mockResolvedValue({}),
}

describe('auth.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSignToken.mockReturnValue('mock-jwt-token')
    mockToProfile.mockReturnValue({ id: 'u1', nombre: 'Carlos', barberia: 'BC', ciudad: 'Bogotá', inicial: 'CL' })
    mockVerifyPassword.mockReturnValue(true)
    mockBarbero.update.mockResolvedValue({})
  })

  describe('register', () => {
    it('returns 201 with token and profile on success', async () => {
      mockRegister.mockResolvedValue(mockBarbero)
      const req = {
        body: { nombres: 'Carlos', email: 'carlos@test.com', celular: '3001234567', password: 'SecurePass1' },
      } as Request
      const res = mockRes()
      await authController.register(req, res)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'mock-jwt-token' }))
    })

    it('propagates HttpError from service', async () => {
      mockRegister.mockRejectedValue(new HttpError(409, 'Email ya existe'))
      const req = {
        body: { nombres: 'X', email: 'dup@test.com', celular: '3001234567', password: 'Pass1234' },
      } as Request
      await expect(authController.register(req, mockRes())).rejects.toThrow(HttpError)
    })
  })

  describe('login', () => {
    it('returns token and profile on valid credentials', async () => {
      mockLogin.mockResolvedValue(mockBarbero)
      const req = { body: { email: 'carlos@test.com', password: 'GoodPass1' } } as Request
      const res = mockRes()
      await authController.login(req, res)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'mock-jwt-token' }))
    })

    it('propagates 401 HttpError on bad credentials', async () => {
      mockLogin.mockRejectedValue(new HttpError(401, 'Credenciales incorrectas'))
      const req = { body: { email: 'bad@test.com', password: 'wrong' } } as Request
      await expect(authController.login(req, mockRes())).rejects.toThrow(HttpError)
    })
  })

  describe('logout', () => {
    it('clears session cookie and returns 204', async () => {
      const res = mockRes()
      await authController.logout({} as Request, res)
      expect(res.clearCookie).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(204)
    })
  })

  describe('me', () => {
    it('returns the current user profile', async () => {
      ;(Barbero.findByPk as jest.Mock).mockResolvedValue(mockBarbero)
      const res = mockRes()
      await authController.me({ auth: { sub: 'u1' } } as any, res)
      expect(res.json).toHaveBeenCalled()
    })

    it('throws 401 when user is not found', async () => {
      ;(Barbero.findByPk as jest.Mock).mockResolvedValue(null)
      await expect(authController.me({ auth: { sub: 'x' } } as any, mockRes())).rejects.toThrow(HttpError)
    })

    it('throws 401 when user is inactive', async () => {
      ;(Barbero.findByPk as jest.Mock).mockResolvedValue({ ...mockBarbero, activo: false })
      await expect(authController.me({ auth: { sub: 'u1' } } as any, mockRes())).rejects.toThrow(HttpError)
    })
  })

  describe('refresh', () => {
    it('issues a new token for the current user', async () => {
      ;(Barbero.findByPk as jest.Mock).mockResolvedValue(mockBarbero)
      const res = mockRes()
      await authController.refresh({ auth: { sub: 'u1' } } as any, res)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'mock-jwt-token' }))
    })
  })

  describe('updateProfile', () => {
    it('updates and returns the profile', async () => {
      ;(Barbero.findByPk as jest.Mock).mockResolvedValue(mockBarbero)
      const res = mockRes()
      await authController.updateProfile({ auth: { sub: 'u1' }, body: { barberia: 'New Shop' } } as any, res)
      expect(mockBarbero.update).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalled()
    })
  })

  describe('updatePassword', () => {
    it('returns 204 when password is updated', async () => {
      ;(Barbero.findByPk as jest.Mock).mockResolvedValue({ ...mockBarbero, passwordHash: 'hash', update: jest.fn().mockResolvedValue({}) })
      const res = mockRes()
      await authController.updatePassword({ auth: { sub: 'u1' }, body: { currentPassword: 'old', newPassword: 'NewPass123' } } as any, res)
      expect(res.status).toHaveBeenCalledWith(204)
    })

    it('throws 401 when current password is wrong', async () => {
      mockVerifyPassword.mockReturnValue(false)
      ;(Barbero.findByPk as jest.Mock).mockResolvedValue({ ...mockBarbero, passwordHash: 'hash', update: jest.fn() })
      const req = { auth: { sub: 'u1' }, body: { currentPassword: 'wrong', newPassword: 'NewPass123' } } as any
      await expect(authController.updatePassword(req, mockRes())).rejects.toThrow(HttpError)
    })
  })
})
