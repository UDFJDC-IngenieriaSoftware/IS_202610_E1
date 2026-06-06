import { getOrCreateSession, saveSession, deleteSession } from '../../src/services/session.service'
import { BotState } from '../../src/controllers/bot.types'

jest.mock('../../src/config/redis', () => ({
  connectRedis: jest.fn().mockResolvedValue(undefined),
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}))

import { redisClient, connectRedis } from '../../src/config/redis'

describe('session.service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getOrCreateSession', () => {
    it('returns parsed session when one exists in Redis', async () => {
      const existing = {
        telefono: '3001234567',
        estadoActual: BotState.SELECT_BARBER,
        datosTemporales: { barbero: 'b1' },
      }
      ;(redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(existing))

      const session = await getOrCreateSession('3001234567')
      expect(session).toEqual(existing)
      expect(connectRedis).toHaveBeenCalled()
    })

    it('creates a new INICIO session when none exists', async () => {
      ;(redisClient.get as jest.Mock).mockResolvedValue(null)

      const session = await getOrCreateSession('3009999999')
      expect(session.telefono).toBe('3009999999')
      expect(session.estadoActual).toBe(BotState.INICIO)
      expect(session.datosTemporales).toEqual({})
    })
  })

  describe('saveSession', () => {
    it('serializes session and stores with TTL in Redis', async () => {
      ;(redisClient.set as jest.Mock).mockResolvedValue('OK')

      const session = {
        telefono: '3001234567',
        estadoActual: BotState.SELECT_BARBER,
        datosTemporales: {},
      }
      await saveSession(session)

      expect(redisClient.set).toHaveBeenCalledWith(
        'session:3001234567',
        JSON.stringify(session),
        expect.objectContaining({ EX: 900 }),
      )
    })

    it('connects to Redis before saving', async () => {
      ;(redisClient.set as jest.Mock).mockResolvedValue('OK')
      const session = { telefono: '300', estadoActual: BotState.INICIO, datosTemporales: {} }
      await saveSession(session)
      expect(connectRedis).toHaveBeenCalled()
    })
  })

  describe('deleteSession', () => {
    it('deletes session key from Redis', async () => {
      ;(redisClient.del as jest.Mock).mockResolvedValue(1)

      await deleteSession('3001234567')
      expect(redisClient.del).toHaveBeenCalledWith('session:3001234567')
    })

    it('connects before deleting', async () => {
      ;(redisClient.del as jest.Mock).mockResolvedValue(0)
      await deleteSession('300')
      expect(connectRedis).toHaveBeenCalled()
    })
  })
})
