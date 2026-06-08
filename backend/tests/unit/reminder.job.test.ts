import { ReminderJob } from '../../src/jobs/reminder.job'

jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({ stop: jest.fn() }),
}))

jest.mock('../../src/services/notification.service', () => ({
  notificationService: {
    sendReminder24h: jest.fn().mockResolvedValue(undefined),
    sendReminder2h: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('../../src/models', () => ({
  Notificacion: { create: jest.fn().mockResolvedValue({}) },
}))

jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}))

import cron from 'node-cron'
import { notificationService } from '../../src/services/notification.service'
import { Notificacion } from '../../src/models'
import logger from '../../src/utils/logger'

// Helpers to build a booking row (all fields required by the new implementation)
const makeBooking24h = (overrides: Partial<Record<string, any>> = {}) => ({
  id: '1',
  fecha_hora: '2026-06-16 14:00',
  customer_phone: '3001234567',
  customer_name: 'Juan García',
  barber_name: 'Carlos',
  service_name: 'Corte',
  reminder_24h_sent: false,
  reminder_2h_sent: true,
  reminder_24h_retries: 0,
  reminder_2h_retries: 0,
  ...overrides,
})

const makeBooking2h = (overrides: Partial<Record<string, any>> = {}) => ({
  id: '2',
  fecha_hora: '2026-06-15 16:00',
  customer_phone: '3009999999',
  customer_name: 'Ana Ruiz',
  barber_name: 'Luis',
  service_name: 'Barba',
  reminder_24h_sent: true,
  reminder_2h_sent: false,
  reminder_24h_retries: 0,
  reminder_2h_retries: 0,
  ...overrides,
})

describe('ReminderJob', () => {
  let job: ReminderJob
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    jest.clearAllMocks()
    job = new ReminderJob()
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  // ─── start / stop ───────────────────────────────────────────────────────────

  describe('start', () => {
    it('skips scheduling in test environment', () => {
      process.env.NODE_ENV = 'test'
      job.start({} as any)
      expect(cron.schedule).not.toHaveBeenCalled()
      expect(logger.info).toHaveBeenCalledWith('Reminder job skipped in test mode')
    })

    it('schedules cron job in non-test environment', () => {
      process.env.NODE_ENV = 'production'
      job.start({} as any)
      expect(cron.schedule).toHaveBeenCalledWith('*/15 * * * *', expect.any(Function))
      expect(logger.info).toHaveBeenCalledWith('Reminder job started (runs every 15 minutes)')
    })
  })

  describe('stop', () => {
    it('stops the task when it is running', () => {
      process.env.NODE_ENV = 'production'
      const mockTask = { stop: jest.fn() }
      ;(cron.schedule as jest.Mock).mockReturnValue(mockTask)
      job.start({} as any)
      job.stop()
      expect(mockTask.stop).toHaveBeenCalled()
      expect(logger.info).toHaveBeenCalledWith('Reminder job stopped')
    })

    it('does nothing when job has not started', () => {
      job.stop()
      expect(logger.info).not.toHaveBeenCalledWith('Reminder job stopped')
    })
  })

  // ─── processReminders ───────────────────────────────────────────────────────

  describe('processReminders (via cron callback)', () => {
    function makeSeq(rows: any[]) {
      return {
        query: jest.fn().mockResolvedValue(rows),
        QueryTypes: { SELECT: 'SELECT' },
      }
    }

    function runCron(seq: any) {
      let cronCallback: (() => Promise<void>) | null = null
      ;(cron.schedule as jest.Mock).mockImplementation((_e: string, cb: () => Promise<void>) => {
        cronCallback = cb
        return { stop: jest.fn() }
      })
      process.env.NODE_ENV = 'production'
      job.start(seq)
      return cronCallback!
    }

    // ── happy path ─────────────────────────────────────────────────────────────

    it('sends 24h reminder and creates Notificacion record on success', async () => {
      const seq = makeSeq([makeBooking24h()])
      const cb = runCron(seq)
      await cb()

      expect(notificationService.sendReminder24h).toHaveBeenCalledWith(
        expect.objectContaining({ customerName: 'Juan García', bookingId: '1' }),
      )
      expect(Notificacion.create).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'recordatorio_24h', idCita: '1' }),
      )
      // Should UPDATE reminder_24h_sent = true
      const updateCall = seq.query.mock.calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('reminder_24h_sent'),
      )
      expect(updateCall).toBeDefined()
    })

    it('sends 2h reminder and creates Notificacion record on success', async () => {
      const seq = makeSeq([makeBooking2h()])
      const cb = runCron(seq)
      await cb()

      expect(notificationService.sendReminder2h).toHaveBeenCalledWith(
        expect.objectContaining({ customerName: 'Ana Ruiz' }),
      )
      expect(Notificacion.create).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'recordatorio_2h', idCita: '2' }),
      )
    })

    it('logs count when reminders are sent', async () => {
      const seq = makeSeq([makeBooking24h()])
      const cb = runCron(seq)
      await cb()
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('1 booking reminders'))
    })

    // ── retry logic ────────────────────────────────────────────────────────────

    it('increments retries and persists error when send fails (first attempt)', async () => {
      ;(notificationService.sendReminder24h as jest.Mock).mockRejectedValueOnce(
        new Error('WhatsApp down'),
      )
      const seq = makeSeq([makeBooking24h({ reminder_24h_retries: 0 })])
      const cb = runCron(seq)
      await cb()

      // Should NOT mark sent=true (no UPDATE with reminder_24h_sent = true without retries)
      const sentUpdate = seq.query.mock.calls.find(
        (c: any[]) => typeof c[0] === 'string' &&
          c[0].startsWith('UPDATE') &&
          c[0].includes('reminder_24h_sent = true') &&
          !c[0].includes('reminder_24h_retries'),
      )
      expect(sentUpdate).toBeUndefined()

      // Should increment retries to 1 via UPDATE
      const retriesUpdate = seq.query.mock.calls.find(
        (c: any[]) => typeof c[0] === 'string' &&
          c[0].startsWith('UPDATE') &&
          c[0].includes('reminder_24h_retries') &&
          !c[0].includes('reminder_24h_sent'),
      )
      expect(retriesUpdate).toBeDefined()
      expect(retriesUpdate![1].replacements).toContain(1)

      // Should persist error in Notificacion
      expect(Notificacion.create).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'recordatorio_24h_fallido', idCita: '1' }),
      )

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('retry'),
        expect.any(Object),
      )
    })

    it('marks sent=true and logs incident when max retries reached', async () => {
      ;(notificationService.sendReminder24h as jest.Mock).mockRejectedValueOnce(
        new Error('Persistent failure'),
      )
      // retries is already at 1 (one prior failure), so next failure hits max
      const seq = makeSeq([makeBooking24h({ reminder_24h_retries: 1 })])
      const cb = runCron(seq)
      await cb()

      // Should mark sent=true AND update retries (give-up UPDATE)
      const giveUpUpdate = seq.query.mock.calls.find(
        (c: any[]) => typeof c[0] === 'string' &&
          c[0].startsWith('UPDATE') &&
          c[0].includes('reminder_24h_sent = true') &&
          c[0].includes('reminder_24h_retries'),
      )
      expect(giveUpUpdate).toBeDefined()
      expect(giveUpUpdate![1].replacements).toContain(2) // newRetries = 2

      expect(Notificacion.create).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'recordatorio_24h_fallido' }),
      )
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Max retries'),
        expect.any(Object),
      )
    })

    it('applies same retry logic for 2h reminders', async () => {
      ;(notificationService.sendReminder2h as jest.Mock).mockRejectedValueOnce(
        new Error('Down'),
      )
      const seq = makeSeq([makeBooking2h({ reminder_2h_retries: 0 })])
      const cb = runCron(seq)
      await cb()

      const retriesUpdate = seq.query.mock.calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].startsWith('UPDATE') && c[0].includes('reminder_2h_retries'),
      )
      expect(retriesUpdate).toBeDefined()
      expect(Notificacion.create).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'recordatorio_2h_fallido' }),
      )
    })

    // ── error handling ─────────────────────────────────────────────────────────

    it('handles DB errors in processReminders gracefully via cron wrapper', async () => {
      const seq = {
        query: jest.fn().mockRejectedValue(new Error('DB error')),
        QueryTypes: { SELECT: 'SELECT' },
      }
      const cb = runCron(seq)
      await expect(cb()).resolves.not.toThrow()
      expect(logger.error).toHaveBeenCalled()
    })
  })
})
