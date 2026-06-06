import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  toProfile,
  AuthService,
  DEFAULT_SCHEDULE,
} from '../../src/services/auth.service'
import { HttpError } from '../../src/utils/http'

jest.mock('../../src/models', () => ({
  Barbero: { findOne: jest.fn(), create: jest.fn() },
  HorarioDia: { bulkCreate: jest.fn() },
  sequelize: {
    transaction: jest.fn((opts, fn) => {
      if (typeof opts === 'function') return opts({ commit: jest.fn() })
      return fn({ commit: jest.fn() })
    }),
  },
}))

import { Barbero, HorarioDia, sequelize } from '../../src/models'

const mockBarbero = {
  id: 'uuid-barbero-1',
  nombres: 'Carlos',
  apellidos: 'López',
  email: 'carlos@test.com',
  rol: 'barbero' as const,
  barberia: 'Barbería Carlos',
  ciudad: 'Bogotá',
  passwordHash: '',
} as any

describe('auth.service – pure functions', () => {
  describe('hashPassword / verifyPassword', () => {
    it('produces a salted hash (salt:hash format)', () => {
      const hash = hashPassword('MyPass123')
      expect(hash).toContain(':')
      const [salt, digest] = hash.split(':')
      expect(salt).toHaveLength(32)
      expect(digest).toHaveLength(64)
    })

    it('generates different hashes for the same password', () => {
      const h1 = hashPassword('MyPass123')
      const h2 = hashPassword('MyPass123')
      expect(h1).not.toBe(h2)
    })

    it('verifies the correct password', () => {
      const hash = hashPassword('CorrectHorse')
      expect(verifyPassword('CorrectHorse', hash)).toBe(true)
    })

    it('rejects a wrong password', () => {
      const hash = hashPassword('CorrectHorse')
      expect(verifyPassword('WrongHorse', hash)).toBe(false)
    })

    it('returns false for a malformed stored hash', () => {
      expect(verifyPassword('anything', 'no-colon-here')).toBe(false)
      expect(verifyPassword('anything', ':')).toBe(false)
    })
  })

  describe('signToken / verifyToken', () => {
    it('signs a token with three JWT parts', () => {
      const token = signToken(mockBarbero)
      expect(token.split('.')).toHaveLength(3)
    })

    it('round-trips: verify returns matching claims', () => {
      const token = signToken(mockBarbero)
      const claims = verifyToken(token)
      expect(claims.sub).toBe(mockBarbero.id)
      expect(claims.email).toBe(mockBarbero.email)
      expect(claims.rol).toBe(mockBarbero.rol)
    })

    it('throws HttpError 401 for a tampered signature', () => {
      const token = signToken(mockBarbero)
      const parts = token.split('.')
      const tampered = `${parts[0]}.${parts[1]}.invalidsignature`
      expect(() => verifyToken(tampered)).toThrow(HttpError)
    })

    it('throws HttpError 401 for a token missing segments', () => {
      expect(() => verifyToken('only.two')).toThrow(HttpError)
      expect(() => verifyToken('one')).toThrow(HttpError)
    })

    it('throws for a token with an invalid payload', () => {
      // Build a header.invalid_base64.signature
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
      const badPayload = 'not-valid-json'
      const fakeToken = `${header}.${badPayload}.signature`
      expect(() => verifyToken(fakeToken)).toThrow(HttpError)
    })
  })

  describe('toProfile', () => {
    it('builds a profile object from a Barbero', () => {
      const profile = toProfile(mockBarbero)
      expect(profile.id).toBe(mockBarbero.id)
      expect(profile.nombre).toBe('Carlos López')
      expect(profile.barberia).toBe('Barbería Carlos')
      expect(profile.ciudad).toBe('Bogotá')
      expect(profile.inicial).toBe('CL')
    })

    it('falls back to nombre when barberia is missing', () => {
      const b = { ...mockBarbero, barberia: undefined }
      const profile = toProfile(b)
      expect(profile.barberia).toBe('Carlos López')
    })

    it('falls back to empty string when ciudad is missing', () => {
      const b = { ...mockBarbero, ciudad: undefined }
      const profile = toProfile(b)
      expect(profile.ciudad).toBe('')
    })
  })

  describe('DEFAULT_SCHEDULE', () => {
    it('has 7 day entries', () => {
      expect(DEFAULT_SCHEDULE).toHaveLength(7)
    })

    it('has Sunday (idx 0) inactive', () => {
      expect(DEFAULT_SCHEDULE[0].activo).toBe(false)
    })
  })
})

describe('AuthService', () => {
  let service: AuthService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new AuthService()
  })

  describe('register', () => {
    const input = {
      nombres: 'Ana',
      apellidos: 'Ruiz',
      email: 'ana@test.com',
      celular: '3001234567',
      password: 'SecurePass1',
    }

    it('throws 409 when email is already taken', async () => {
      ;(Barbero.findOne as jest.Mock).mockResolvedValue(mockBarbero)
      await expect(service.register(input)).rejects.toThrow(HttpError)
      const err = await service.register(input).catch((e) => e)
      expect(err.status).toBe(409)
    })

    it('throws 400 when password is too short', async () => {
      ;(Barbero.findOne as jest.Mock).mockResolvedValue(null)
      await expect(service.register({ ...input, password: 'short' })).rejects.toThrow(HttpError)
    })

    it('creates a Barbero and default schedule when valid', async () => {
      ;(Barbero.findOne as jest.Mock).mockResolvedValue(null)
      const created = { id: 'new-uuid', ...input }
      ;(sequelize.transaction as jest.Mock).mockImplementation(async (fn: any) => {
        ;(Barbero.create as jest.Mock).mockResolvedValue(created)
        ;(HorarioDia.bulkCreate as jest.Mock).mockResolvedValue([])
        return fn({})
      })

      const user = await service.register(input)
      expect(user.id).toBe('new-uuid')
      expect(HorarioDia.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ idBarbero: 'new-uuid' })]),
        expect.any(Object),
      )
    })
  })

  describe('login', () => {
    it('returns the user for valid credentials', async () => {
      const hash = hashPassword('GoodPass1')
      ;(Barbero.findOne as jest.Mock).mockResolvedValue({ ...mockBarbero, passwordHash: hash })

      const user = await service.login('carlos@test.com', 'GoodPass1')
      expect(user.email).toBe(mockBarbero.email)
    })

    it('throws 401 for unknown email', async () => {
      ;(Barbero.findOne as jest.Mock).mockResolvedValue(null)
      await expect(service.login('noone@test.com', 'pass')).rejects.toThrow(HttpError)
    })

    it('throws 401 for wrong password', async () => {
      const hash = hashPassword('GoodPass1')
      ;(Barbero.findOne as jest.Mock).mockResolvedValue({ ...mockBarbero, passwordHash: hash })
      await expect(service.login('carlos@test.com', 'WrongPass')).rejects.toThrow(HttpError)
    })

    it('throws 401 when user has no passwordHash', async () => {
      ;(Barbero.findOne as jest.Mock).mockResolvedValue({ ...mockBarbero, passwordHash: null })
      await expect(service.login('carlos@test.com', 'AnyPass')).rejects.toThrow(HttpError)
    })
  })
})
