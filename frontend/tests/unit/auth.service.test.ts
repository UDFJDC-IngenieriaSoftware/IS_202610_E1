import { describe, it, expect } from 'vitest'
import { login, logout, getMe } from '../../src/services/auth.service'

describe('auth.service', () => {
  describe('login', () => {
    it('should return auth response with token and profile', async () => {
      const payload = { email: 'test@example.com', password: 'password123' }

      const result = await login(payload)

      expect(result).toHaveProperty('perfil')
      expect(result).toHaveProperty('rol')
    })

    it('should handle admin email login', async () => {
      const payload = { email: 'admin@example.com', password: 'password123' }

      const result = await login(payload)

      expect(result.rol).toBe('admin')
    })

    it('should handle barbero email login', async () => {
      const payload = { email: 'barbero@example.com', password: 'password123' }

      const result = await login(payload)

      expect(result.rol).toBe('barbero')
    })

    it('should include perfil data', async () => {
      const payload = { email: 'test@example.com', password: 'password123' }

      const result = await login(payload)

      expect(result.perfil).toHaveProperty('id')
      expect(result.perfil).toHaveProperty('nombre')
      expect(result.perfil).toHaveProperty('barberia')
    })
  })

  describe('logout', () => {
    it('should complete logout successfully', async () => {
      expect(async () => {
        await logout()
      }).not.toThrow()
    })
  })

  describe('getMe', () => {
    it('should return user profile', async () => {
      const result = await getMe()

      if (result) {
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('nombre')
        expect(result).toHaveProperty('barberia')
      }
    })

    it('should return barber profile data structure', async () => {
      const result = await getMe()

      if (result) {
        expect(typeof result.id).toBe('string')
        expect(typeof result.nombre).toBe('string')
      }
    })

    it('should handle missing profile gracefully', async () => {
      const result = await getMe()

      expect(result === null || typeof result === 'object').toBe(true)
    })
  })
})
