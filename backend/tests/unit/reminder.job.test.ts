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
jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn() },
}))

import cron from 'node-cron'
import { notificationService } from '../../src/services/notification.service'
import logger from '../../src/utils/logger'

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

  describe('start', () => {
    it('skips scheduling in test environment', () => {
      process.env.NODE_ENV = 'test'
      const mockSequelize = {} as any
      job.start(mockSequelize)
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

  describe('processReminders (via cron callback)', () => {
    it('sends 24h reminder for qualifying bookings', async () => {
      process.env.NODE_ENV = 'production'
      const booking24h = {
        id: 1, date: '2026-06-16', time: '14:00',
        customer_phone: '3001234567', customer_name: 'Juan García',
        barber_name: 'Carlos', service_name: 'Corte',
        reminder_24h_sent: false, reminder_2h_sent: true,
      }
      const mockSeq = {
        query: jest.fn().mockResolvedValueOnce([booking24h]).mockResolvedValueOnce([]),
        QueryTypes: { SELECT: 'SELECT' },
      }

      let cronCallback: (() => Promise<void>) | null = null
      ;(cron.schedule as jest.Mock).mockImplementation((_expr: string, cb: () => Promise<void>) => {
        cronCallback = cb
        return { stop: jest.fn() }
      })

      job.start(mockSeq)
      await cronCallback!()

      expect(notificationService.sendReminder24h).toHaveBeenCalledWith(
        expect.objectContaining({ customerName: 'Juan García', bookingId: 1 }),
      )
    })

    it('sends 2h reminder for qualifying bookings', async () => {
      process.env.NODE_ENV = 'production'
      const booking2h = {
        id: 2, date: '2026-06-15', time: '16:00',
        customer_phone: '3009999999', customer_name: 'Ana Ruiz',
        barber_name: 'Luis', service_name: 'Barba',
        reminder_24h_sent: true, reminder_2h_sent: false,
      }
      const mockSeq = {
        query: jest.fn().mockResolvedValueOnce([booking2h]).mockResolvedValueOnce([]),
        QueryTypes: { SELECT: 'SELECT' },
      }

      let cronCallback: (() => Promise<void>) | null = null
      ;(cron.schedule as jest.Mock).mockImplementation((_expr: string, cb: () => Promise<void>) => {
        cronCallback = cb
        return { stop: jest.fn() }
      })

      job.start(mockSeq)
      await cronCallback!()

      expect(notificationService.sendReminder2h).toHaveBeenCalledWith(
        expect.objectContaining({ customerName: 'Ana Ruiz' }),
      )
    })

    it('logs count when reminders are sent', async () => {
      process.env.NODE_ENV = 'production'
      const booking = {
        id: 3, date: '2026-06-15', time: '10:00',
        customer_phone: '300', customer_name: 'Pedro', barber_name: 'B', service_name: 'S',
        reminder_24h_sent: false, reminder_2h_sent: false,
      }
      const mockSeq = {
        query: jest.fn().mockResolvedValue([booking]),
        QueryTypes: { SELECT: 'SELECT' },
      }

      let cronCallback: (() => Promise<void>) | null = null
      ;(cron.schedule as jest.Mock).mockImplementation((_expr: string, cb: () => Promise<void>) => {
        cronCallback = cb
        return { stop: jest.fn() }
      })

      job.start(mockSeq)
      await cronCallback!()

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('reminder'))
    })

    it('handles errors in processReminders gracefully', async () => {
      process.env.NODE_ENV = 'production'
      const mockSeq = {
        query: jest.fn().mockRejectedValue(new Error('DB error')),
        QueryTypes: { SELECT: 'SELECT' },
      }

      let cronCallback: (() => Promise<void>) | null = null
      ;(cron.schedule as jest.Mock).mockImplementation((_expr: string, cb: () => Promise<void>) => {
        cronCallback = cb
        return { stop: jest.fn() }
      })

      job.start(mockSeq)
      // The cron callback itself catches errors
      await expect(cronCallback!()).resolves.not.toThrow()
      expect(logger.error).toHaveBeenCalled()
    })
  })
})
