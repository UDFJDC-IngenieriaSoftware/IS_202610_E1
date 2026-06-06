import { BarberService } from '../../src/services/barber.service'
import { ProcedureService } from '../../src/services/procedure.service'

jest.mock('../../src/models/Barbero', () => ({
  __esModule: true,
  default: { findAll: jest.fn() },
}))

import BarberModel from '../../src/models/Barbero'

describe('BarberService', () => {
  let procedureService: jest.Mocked<ProcedureService>
  let service: BarberService

  beforeEach(() => {
    jest.clearAllMocks()
    procedureService = {
      getBarberProcedures: jest.fn(),
    } as any
    service = new BarberService(procedureService)
  })

  describe('getAllBarbers', () => {
    it('returns list of active barbers', async () => {
      const mockBarbers = [
        { id: 'b1', nombres: 'Carlos', activo: true },
        { id: 'b2', nombres: 'Luis', activo: true },
      ]
      ;(BarberModel.findAll as jest.Mock).mockResolvedValue(mockBarbers)

      const result = await service.getAllBarbers()
      expect(result).toEqual(mockBarbers)
      expect(BarberModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { activo: true } }),
      )
    })

    it('returns empty array when no active barbers', async () => {
      ;(BarberModel.findAll as jest.Mock).mockResolvedValue([])
      const result = await service.getAllBarbers()
      expect(result).toEqual([])
    })
  })

  describe('toText', () => {
    it('joins array items with newlines', async () => {
      const result = await service.toText(['Item 1', 'Item 2', 'Item 3'])
      expect(result).toBe('Item 1\nItem 2\nItem 3')
    })

    it('returns single item without newline', async () => {
      const result = await service.toText(['Only one'])
      expect(result).toBe('Only one')
    })

    it('returns empty string for empty array', async () => {
      const result = await service.toText([])
      expect(result).toBe('')
    })
  })

  describe('getProcedures', () => {
    it('returns procedures for the given barber', async () => {
      const mockProcedures = [{ id: 'p1', nombre: 'Corte' }]
      procedureService.getBarberProcedures.mockResolvedValue(mockProcedures)

      const result = await service.getProcedures('b1')
      expect(result).toEqual(mockProcedures)
      expect(procedureService.getBarberProcedures).toHaveBeenCalledWith('b1')
    })

    it('throws when barber has no procedures', async () => {
      procedureService.getBarberProcedures.mockResolvedValue([])
      await expect(service.getProcedures('b-empty')).rejects.toThrow('Barber has not any procedure to offer')
    })
  })
})
