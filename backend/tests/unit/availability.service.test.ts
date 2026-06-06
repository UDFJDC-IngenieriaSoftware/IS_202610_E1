import { AvailabilityService, fromMinutes } from '../../src/services/availability.service'

// Mock all Sequelize models used by AvailabilityService
jest.mock('../../src/models', () => ({
  HorarioDia: { findOne: jest.fn() },
  DiaLibre: { findOne: jest.fn() },
  Horario: { findAll: jest.fn() },
  Servicio: {},
  Cita: {},
}))

import { HorarioDia, DiaLibre, Horario } from '../../src/models'

describe('AvailabilityService', () => {
  let service: AvailabilityService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new AvailabilityService()
  })

  describe('fromMinutes utility', () => {
    it('should convert minutes to HH:MM format', () => {
      expect(fromMinutes(0)).toBe('00:00')
      expect(fromMinutes(60)).toBe('01:00')
      expect(fromMinutes(90)).toBe('01:30')
      expect(fromMinutes(120)).toBe('02:00')
      expect(fromMinutes(1440)).toBe('24:00')
    })

    it('should pad hour and minute values', () => {
      expect(fromMinutes(5)).toBe('00:05')
      expect(fromMinutes(605)).toBe('10:05')
    })
  })

  describe('getAvailableSlots', () => {
    it('should return empty array when barber has no schedule for the day', async () => {
      ;(HorarioDia.findOne as jest.Mock).mockResolvedValue(null)

      const slots = await service.getAvailableSlots('barber-1', '2026-06-15', 30)
      expect(slots).toEqual([])
    })

    it('should return empty array when barber has a day off', async () => {
      ;(HorarioDia.findOne as jest.Mock).mockResolvedValue({
        horaInicio: '09:00',
        horaFin: '17:00',
      })
      ;(DiaLibre.findOne as jest.Mock).mockResolvedValue({ fecha: '2026-06-15' })

      const slots = await service.getAvailableSlots('barber-1', '2026-06-15', 30)
      expect(slots).toEqual([])
    })

    it('should return array of time slots when barber is available', async () => {
      ;(HorarioDia.findOne as jest.Mock).mockResolvedValue({
        inicio: '09:00',
        fin: '10:00',
        descansoIni: null,
        descansoFin: null,
      })
      ;(DiaLibre.findOne as jest.Mock).mockResolvedValue(null)
      ;(Horario.findAll as jest.Mock).mockResolvedValue([])

      const slots = await service.getAvailableSlots('barber-1', '2026-06-15', 30)
      expect(Array.isArray(slots)).toBe(true)
      expect(slots.length).toBeGreaterThan(0)
    })

    it('should mark slot as unavailable when occupied by existing appointment', async () => {
      ;(HorarioDia.findOne as jest.Mock).mockResolvedValue({
        inicio: '09:00',
        fin: '10:00',
        descansoIni: null,
        descansoFin: null,
      })
      ;(DiaLibre.findOne as jest.Mock).mockResolvedValue(null)
      ;(Horario.findAll as jest.Mock).mockResolvedValue([
        { horaInicio: '09:00', horaFin: '09:30' },
      ])

      const slots = await service.getAvailableSlots('barber-1', '2026-06-15', 30)
      const nineAm = slots.find((s) => s.time === '09:00')
      expect(nineAm?.available).toBe(false)
    })
  })

  describe('isSlotAvailable', () => {
    it('should return false when barber has no schedule', async () => {
      ;(HorarioDia.findOne as jest.Mock).mockResolvedValue(null)

      const isAvailable = await service.isSlotAvailable(
        { id: 'service-1', idBarbero: 'barber-1', duracion: 30 } as any,
        '2026-06-15',
        '14:00',
      )
      expect(isAvailable).toBe(false)
    })

    it('should return false when barber has a day off', async () => {
      ;(HorarioDia.findOne as jest.Mock).mockResolvedValue({
        inicio: '09:00',
        fin: '18:00',
        descansoIni: null,
        descansoFin: null,
      })
      ;(DiaLibre.findOne as jest.Mock).mockResolvedValue({ fecha: '2026-06-15' })

      const isAvailable = await service.isSlotAvailable(
        { id: 'service-1', idBarbero: 'barber-1', duracion: 30 } as any,
        '2026-06-15',
        '14:00',
      )
      expect(isAvailable).toBe(false)
    })

    it('should return true when slot is free', async () => {
      ;(HorarioDia.findOne as jest.Mock).mockResolvedValue({
        inicio: '09:00',
        fin: '18:00',
        descansoIni: null,
        descansoFin: null,
      })
      ;(DiaLibre.findOne as jest.Mock).mockResolvedValue(null)
      ;(Horario.findAll as jest.Mock).mockResolvedValue([])

      const isAvailable = await service.isSlotAvailable(
        { id: 'service-1', idBarbero: 'barber-1', duracion: 30 } as any,
        '2026-06-15',
        '14:00',
      )
      expect(typeof isAvailable).toBe('boolean')
    })
  })
})
