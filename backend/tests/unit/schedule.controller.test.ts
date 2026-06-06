import { HttpError } from '../../src/utils/http'

jest.mock('../../src/models', () => ({
  HorarioDia: { findAll: jest.fn(), findOne: jest.fn(), count: jest.fn(), bulkCreate: jest.fn() },
  DiaLibre: { findAll: jest.fn(), findOrCreate: jest.fn(), destroy: jest.fn() },
}))
jest.mock('../../src/services/auth.service', () => ({
  DEFAULT_SCHEDULE: [
    { idx: 0, activo: false, inicio: '09:00', fin: '18:00', descansoIni: '', descansoFin: '' },
  ],
}))

import * as scheduleController from '../../src/controllers/schedule.controller'
import { HorarioDia, DiaLibre } from '../../src/models'

function mockRes() {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

const mockSchedule = {
  idx: 1, activo: true, inicio: '09:00', fin: '18:00', descansoIni: '13:00', descansoFin: '14:00',
  idBarbero: 'barber-1',
  update: jest.fn().mockResolvedValue({}),
}

describe('schedule.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(HorarioDia.count as jest.Mock).mockResolvedValue(7)
    mockSchedule.update.mockResolvedValue({})
  })

  describe('listSchedule', () => {
    it('returns serialized weekly schedule', async () => {
      ;(HorarioDia.findAll as jest.Mock).mockResolvedValue([mockSchedule])
      const req = { auth: { sub: 'barber-1' } } as any
      const res = mockRes()
      await scheduleController.listSchedule(req, res)
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ idx: 1, activo: true })]),
      )
    })

    it('creates default schedule when none exists', async () => {
      ;(HorarioDia.count as jest.Mock).mockResolvedValue(0)
      ;(HorarioDia.bulkCreate as jest.Mock).mockResolvedValue([])
      ;(HorarioDia.findAll as jest.Mock).mockResolvedValue([])
      const req = { auth: { sub: 'barber-new' } } as any
      await scheduleController.listSchedule(req, mockRes())
      expect(HorarioDia.bulkCreate).toHaveBeenCalled()
    })
  })

  describe('updateSchedule', () => {
    it('updates schedule for a valid day index', async () => {
      ;(HorarioDia.findOne as jest.Mock).mockResolvedValue(mockSchedule)
      const req = {
        auth: { sub: 'barber-1' },
        params: { idx: '1' },
        body: { inicio: '09:00', fin: '18:00', activo: true },
      } as any
      const res = mockRes()
      await scheduleController.updateSchedule(req, res)
      expect(mockSchedule.update).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalled()
    })

    it('throws 400 for invalid day index', async () => {
      const req = { auth: { sub: 'barber-1' }, params: { idx: '7' }, body: {} } as any
      await expect(scheduleController.updateSchedule(req, mockRes())).rejects.toThrow(HttpError)
    })

    it('throws 404 when schedule day not found', async () => {
      ;(HorarioDia.findOne as jest.Mock).mockResolvedValue(null)
      const req = { auth: { sub: 'barber-1' }, params: { idx: '1' }, body: {} } as any
      await expect(scheduleController.updateSchedule(req, mockRes())).rejects.toThrow(HttpError)
    })

    it('throws 400 when inicio >= fin', async () => {
      ;(HorarioDia.findOne as jest.Mock).mockResolvedValue(mockSchedule)
      const req = {
        auth: { sub: 'barber-1' }, params: { idx: '1' },
        body: { inicio: '18:00', fin: '09:00' },
      } as any
      await expect(scheduleController.updateSchedule(req, mockRes())).rejects.toThrow(HttpError)
    })

    it('throws 400 for invalid time format', async () => {
      ;(HorarioDia.findOne as jest.Mock).mockResolvedValue(mockSchedule)
      const req = {
        auth: { sub: 'barber-1' }, params: { idx: '1' },
        body: { inicio: '9:0', fin: '18:00' },
      } as any
      await expect(scheduleController.updateSchedule(req, mockRes())).rejects.toThrow(HttpError)
    })
  })

  describe('listDaysOff', () => {
    it('returns list of days off', async () => {
      ;(DiaLibre.findAll as jest.Mock).mockResolvedValue([
        { id: 'd1', fecha: '2026-06-20', motivo: 'Vacaciones' },
      ])
      const req = { auth: { sub: 'barber-1' } } as any
      const res = mockRes()
      await scheduleController.listDaysOff(req, res)
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ fecha: '2026-06-20' })]),
      )
    })

    it('returns empty array when no days off', async () => {
      ;(DiaLibre.findAll as jest.Mock).mockResolvedValue([])
      await scheduleController.listDaysOff({ auth: { sub: 'barber-1' } } as any, mockRes())
      expect(DiaLibre.findAll).toHaveBeenCalled()
    })
  })

  describe('addDayOff', () => {
    it('creates new day off and returns 201', async () => {
      const day = { id: 'd1', fecha: '2026-06-20', motivo: 'Vacaciones', update: jest.fn() }
      ;(DiaLibre.findOrCreate as jest.Mock).mockResolvedValue([day, true])
      const req = { auth: { sub: 'barber-1' }, body: { fecha: '2026-06-20', motivo: 'Vacaciones' } } as any
      const res = mockRes()
      await scheduleController.addDayOff(req, res)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ fecha: '2026-06-20' }))
    })

    it('returns 200 when day off already exists', async () => {
      const day = { id: 'd1', fecha: '2026-06-20', motivo: 'Ya existe', update: jest.fn() }
      ;(DiaLibre.findOrCreate as jest.Mock).mockResolvedValue([day, false])
      const req = { auth: { sub: 'barber-1' }, body: { fecha: '2026-06-20' } } as any
      const res = mockRes()
      await scheduleController.addDayOff(req, res)
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('removeDayOff', () => {
    it('deletes day off and returns 204', async () => {
      ;(DiaLibre.destroy as jest.Mock).mockResolvedValue(1)
      const req = { auth: { sub: 'barber-1' }, params: { id: 'd1' } } as any
      const res = mockRes()
      await scheduleController.removeDayOff(req, res)
      expect(res.status).toHaveBeenCalledWith(204)
    })

    it('throws 404 when day off not found', async () => {
      ;(DiaLibre.destroy as jest.Mock).mockResolvedValue(0)
      const req = { auth: { sub: 'barber-1' }, params: { id: 'missing' } } as any
      await expect(scheduleController.removeDayOff(req, mockRes())).rejects.toThrow(HttpError)
    })
  })
})
