import { PaymentTimeoutJob } from '../../src/jobs/payment-timeout.job'

jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({ stop: jest.fn() }),
}))

jest.mock('../../src/models', () => ({
  Cita: { findAll: jest.fn() },
  Pago: {},
}))

jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn() },
}))

import cron from 'node-cron'
import logger from '../../src/utils/logger'
import { Cita } from '../../src/models'

const mockCitaFindAll = Cita.findAll as jest.Mock

describe('PaymentTimeoutJob', () => {
  let job: PaymentTimeoutJob
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    jest.clearAllMocks()
    job = new PaymentTimeoutJob()
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  describe('start', () => {
    it('skips scheduling in test environment', () => {
      process.env.NODE_ENV = 'test'
      job.start()
      expect(cron.schedule).not.toHaveBeenCalled()
      expect(logger.info).toHaveBeenCalledWith('Payment timeout job skipped in test mode')
    })

    it('schedules cron job every 5 minutes in non-test environment', () => {
      process.env.NODE_ENV = 'production'
      job.start()
      expect(cron.schedule).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function))
      expect(logger.info).toHaveBeenCalledWith('Payment timeout job started (runs every 5 minutes)')
    })
  })

  describe('stop', () => {
    it('stops the task when it is running', () => {
      process.env.NODE_ENV = 'production'
      const mockTask = { stop: jest.fn() }
      ;(cron.schedule as jest.Mock).mockReturnValue(mockTask)
      job.start()
      job.stop()
      expect(mockTask.stop).toHaveBeenCalled()
      expect(logger.info).toHaveBeenCalledWith('Payment timeout job stopped')
    })

    it('does nothing when job has not started', () => {
      job.stop()
      expect(logger.info).not.toHaveBeenCalledWith('Payment timeout job stopped')
    })
  })

  describe('cancelExpiredPayments', () => {
    it('returns 0 when no expired pending citas found', async () => {
      mockCitaFindAll.mockResolvedValue([])
      const count = await job.cancelExpiredPayments()
      expect(count).toBe(0)
      expect(logger.info).not.toHaveBeenCalledWith(expect.stringContaining('cancelled'))
    })

    it('cancels expired cita and its pending pagos', async () => {
      const mockPago = { id: 'p1', update: jest.fn().mockResolvedValue({}) }
      const mockCita = {
        id: 'c1',
        update: jest.fn().mockResolvedValue({}),
        pagos: [mockPago],
      }
      mockCitaFindAll.mockResolvedValue([mockCita])

      const count = await job.cancelExpiredPayments()

      expect(count).toBe(1)
      expect(mockCita.update).toHaveBeenCalledWith({ estado: 'cancelada' })
      expect(mockPago.update).toHaveBeenCalledWith({ estado: 'fallido' })
      expect(logger.info).toHaveBeenCalledWith(
        'Auto-cancelled expired pending cita',
        { citaId: 'c1' },
      )
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('cancelled 1 expired'),
      )
    })

    it('handles citas with no associated pagos', async () => {
      const mockCita = {
        id: 'c2',
        update: jest.fn().mockResolvedValue({}),
        pagos: [],
      }
      mockCitaFindAll.mockResolvedValue([mockCita])

      const count = await job.cancelExpiredPayments()
      expect(count).toBe(1)
      expect(mockCita.update).toHaveBeenCalledWith({ estado: 'cancelada' })
    })

    it('processes multiple expired citas', async () => {
      const makeCita = (id: string) => ({
        id,
        update: jest.fn().mockResolvedValue({}),
        pagos: [{ id: `p-${id}`, update: jest.fn().mockResolvedValue({}) }],
      })
      mockCitaFindAll.mockResolvedValue([makeCita('c1'), makeCita('c2'), makeCita('c3')])

      const count = await job.cancelExpiredPayments()
      expect(count).toBe(3)
    })

    it('continues processing other citas when one fails', async () => {
      const failingCita = {
        id: 'fail',
        update: jest.fn().mockRejectedValue(new Error('DB error')),
        pagos: [],
      }
      const goodCita = {
        id: 'ok',
        update: jest.fn().mockResolvedValue({}),
        pagos: [],
      }
      mockCitaFindAll.mockResolvedValue([failingCita, goodCita])

      const count = await job.cancelExpiredPayments()
      expect(count).toBe(1)
      expect(logger.error).toHaveBeenCalledWith(
        'Error cancelling expired cita',
        expect.objectContaining({ citaId: 'fail' }),
      )
    })

    it('queries citas with cutoff 30 minutes ago', async () => {
      mockCitaFindAll.mockResolvedValue([])
      const before = Date.now()
      await job.cancelExpiredPayments()
      const after = Date.now()

      const [[call]] = mockCitaFindAll.mock.calls
      const cutoff: Date = call.where.createdAt['$lt'] ?? call.where.createdAt[require('sequelize').Op?.lt]
      // cutoff should be ~30 minutes before now
      const diff = before - cutoff.getTime()
      expect(diff).toBeGreaterThanOrEqual(29 * 60 * 1000)
      expect(diff).toBeLessThanOrEqual(31 * 60 * 1000)
    })

    it('cron callback catches and logs errors', async () => {
      process.env.NODE_ENV = 'production'
      mockCitaFindAll.mockRejectedValue(new Error('DB down'))

      let cronCallback: (() => Promise<void>) | null = null
      ;(cron.schedule as jest.Mock).mockImplementation((_expr: string, cb: () => Promise<void>) => {
        cronCallback = cb
        return { stop: jest.fn() }
      })

      job.start()
      await expect(cronCallback!()).resolves.not.toThrow()
      expect(logger.error).toHaveBeenCalledWith(
        'Error in payment timeout job',
        expect.objectContaining({ error: expect.stringContaining('DB down') }),
      )
    })
  })
})
