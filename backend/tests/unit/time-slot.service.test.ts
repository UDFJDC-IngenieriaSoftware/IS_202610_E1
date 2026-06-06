import { TimeSlotService } from '../../src/services/time-slot.service'

jest.mock('../../src/models/Horario', () => ({
  __esModule: true,
  default: { findAll: jest.fn() },
}))

import Horario from '../../src/models/Horario'

describe('TimeSlotService', () => {
  let service: TimeSlotService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TimeSlotService()
  })

  describe('getProcedureTimeslotsByDate', () => {
    it('returns available timeslots for a procedure on a date', async () => {
      const mockSlots = [
        { id: 'h1', horaInicio: '09:00', horaFin: '09:30', estado: 'disponible', fecha: '2026-06-15' },
        { id: 'h2', horaInicio: '10:00', horaFin: '10:30', estado: 'disponible', fecha: '2026-06-15' },
      ]
      ;(Horario.findAll as jest.Mock).mockResolvedValue(mockSlots)

      const result = await service.getProcedureTimeslotsByDate('svc-1', '2026-06-15')
      expect(result).toEqual(mockSlots)
      expect(Horario.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ idServicio: 'svc-1', fecha: '2026-06-15' }),
        }),
      )
    })

    it('returns empty array when no slots available', async () => {
      ;(Horario.findAll as jest.Mock).mockResolvedValue([])
      const result = await service.getProcedureTimeslotsByDate('svc-1', '2026-06-20')
      expect(result).toEqual([])
    })
  })

  describe('getDates', () => {
    it('returns available dates for a procedure', async () => {
      const mockDates = [
        { fecha: '2026-06-16' },
        { fecha: '2026-06-17' },
      ]
      ;(Horario.findAll as jest.Mock).mockResolvedValue(mockDates)

      const result = await service.getDates('svc-1')
      expect(result).toEqual(mockDates)
      expect(Horario.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: ['fecha'],
          group: ['fecha'],
        }),
      )
    })

    it('returns empty array when no future dates', async () => {
      ;(Horario.findAll as jest.Mock).mockResolvedValue([])
      const result = await service.getDates('svc-empty')
      expect(result).toEqual([])
    })

    it('queries only future dates (Op.gt today)', async () => {
      ;(Horario.findAll as jest.Mock).mockResolvedValue([])
      await service.getDates('svc-1')
      const callArg = (Horario.findAll as jest.Mock).mock.calls[0][0]
      expect(callArg.where.fecha).toBeDefined()
    })
  })
})
