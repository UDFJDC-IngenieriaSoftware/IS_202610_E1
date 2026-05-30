import { signToken, verifyToken, refreshToken } from '../../src/config/jwt'

describe('JWT Service', () => {
  const testPayload = {
    userId: 1,
    email: 'test@example.com',
    role: 'barber' as const,
  }

  describe('signToken', () => {
    it('should sign a token with payload', () => {
      const token = signToken(testPayload)
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3) // JWT has 3 parts
    })

    it('should include payload in token', () => {
      const token = signToken(testPayload)
      const verified = verifyToken(token)
      expect(verified.userId).toBe(testPayload.userId)
      expect(verified.email).toBe(testPayload.email)
      expect(verified.role).toBe(testPayload.role)
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = signToken(testPayload)
      const verified = verifyToken(token)
      expect(verified).toBeDefined()
      expect(verified.userId).toBe(testPayload.userId)
    })

    it('should throw on invalid token', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow()
    })

    it('should throw on malformed token', () => {
      expect(() => verifyToken('not-a-token')).toThrow()
    })
  })

  describe('refreshToken', () => {
    it('should generate new token with same payload', () => {
      const token1 = signToken(testPayload)
      const verified1 = verifyToken(token1)

      const token2 = refreshToken(testPayload)
      const verified2 = verifyToken(token2)

      expect(verified1.userId).toBe(verified2.userId)
      expect(verified1.email).toBe(verified2.email)
      expect(token1).not.toBe(token2) // Different tokens
    })
  })
})
