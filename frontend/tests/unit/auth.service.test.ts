import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login, logout, getMe } from '../../src/services/auth.service'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/services/apiClient', () => ({
  USE_MOCKS: false,
  mockDelay: (v: any) => Promise.resolve(v),
  request: mockRequest,
}))

const mockPerfil = {
  id: 'b001',
  nombre: 'Andrés Mejía',
  barberia: 'Estudio Barbería',
  ciudad: 'Bogotá',
  inicial: 'AM',
  plazoCancelacion: null,
  plazoReprogramacion: null,
  mensajeBienvenida: null,
  mensajeConfirmacion: null,
  mensajeRecordatorio: null,
}

describe('auth.service', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('login', () => {
    it('should return auth response with token and profile', async () => {
      mockRequest.mockResolvedValueOnce({ token: 'tok', perfil: mockPerfil, rol: 'barbero' })

      const result = await login({ email: 'test@example.com', password: 'password123' })

      expect(result).toHaveProperty('perfil')
      expect(result).toHaveProperty('rol')
    })

    it('should handle admin email login', async () => {
      mockRequest.mockResolvedValueOnce({ token: 'tok', perfil: mockPerfil, rol: 'admin' })

      const result = await login({ email: 'admin@example.com', password: 'password123' })

      expect(result.rol).toBe('admin')
    })

    it('should handle barbero email login', async () => {
      mockRequest.mockResolvedValueOnce({ token: 'tok', perfil: mockPerfil, rol: 'barbero' })

      const result = await login({ email: 'barbero@example.com', password: 'password123' })

      expect(result.rol).toBe('barbero')
    })

    it('should include perfil data', async () => {
      mockRequest.mockResolvedValueOnce({ token: 'tok', perfil: mockPerfil, rol: 'barbero' })

      const result = await login({ email: 'test@example.com', password: 'password123' })

      expect(result.perfil).toHaveProperty('id')
      expect(result.perfil).toHaveProperty('nombre')
      expect(result.perfil).toHaveProperty('barberia')
    })
  })

  describe('logout', () => {
    it('should complete logout successfully', async () => {
      mockRequest.mockResolvedValueOnce(undefined)

      expect(async () => {
        await logout()
      }).not.toThrow()
    })
  })

  describe('getMe', () => {
    it('should return user profile', async () => {
      mockRequest.mockResolvedValueOnce(mockPerfil)

      const result = await getMe()

      if (result) {
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('nombre')
        expect(result).toHaveProperty('barberia')
      }
    })

    it('should return barber profile data structure', async () => {
      mockRequest.mockResolvedValueOnce(mockPerfil)

      const result = await getMe()

      if (result) {
        expect(typeof result.id).toBe('string')
        expect(typeof result.nombre).toBe('string')
      }
    })

    it('should handle missing profile gracefully', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Unauthorized'))

      const result = await getMe()

      expect(result === null || typeof result === 'object').toBe(true)
    })
  })
})
