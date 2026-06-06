import { ProcedureService } from '../../src/services/procedure.service'

jest.mock('../../src/models/Servicio', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
}))

import Servicio from '../../src/models/Servicio'

describe('ProcedureService', () => {
  let service: ProcedureService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ProcedureService({} as any)
  })

  describe('getAllProcedures', () => {
    it('returns hardcoded list of 5 procedures', async () => {
      const result = await service.getAllProcedures()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(5)
    })

    it('each procedure has required fields', async () => {
      const result = await service.getAllProcedures()
      result.forEach((p) => {
        expect(p).toHaveProperty('id')
        expect(p).toHaveProperty('nombre')
        expect(p).toHaveProperty('precio')
        expect(p).toHaveProperty('duracion')
        expect(p).toHaveProperty('idBarbero')
      })
    })
  })

  describe('getBarberProcedures', () => {
    it('queries Servicio with the given barber id', async () => {
      ;(Servicio.findAll as jest.Mock).mockResolvedValue([{ id: '1', nombre: 'Corte' }])
      const result = await service.getBarberProcedures('barber-1')
      expect(Servicio.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { idBarbero: 'barber-1' } }),
      )
      expect(result).toHaveLength(1)
    })

    it('returns empty array when barber has no procedures', async () => {
      ;(Servicio.findAll as jest.Mock).mockResolvedValue([])
      const result = await service.getBarberProcedures('unknown-barber')
      expect(result).toEqual([])
    })
  })

  describe('selectProcedure', () => {
    it('returns the procedure when found', async () => {
      const mockProc = { id: '1', nombre: 'Corte', precio: 25000 }
      ;(Servicio.findByPk as jest.Mock).mockResolvedValue(mockProc)
      const result = await service.selectProcedure('1')
      expect(result).toEqual(mockProc)
    })

    it('returns null when not found', async () => {
      ;(Servicio.findByPk as jest.Mock).mockResolvedValue(null)
      const result = await service.selectProcedure('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('checkAvailability', () => {
    it('always returns true (stub)', async () => {
      const result = await service.checkAvailability('any-id')
      expect(result).toBe(true)
    })
  })

  describe('getDescription', () => {
    it('returns "not found" message when procedure does not exist', async () => {
      ;(Servicio.findByPk as jest.Mock).mockResolvedValue(null)
      const result = await service.getDescription('nonexistent')
      expect(result).toBe('Servicio no encontrado.')
    })

    it('returns formatted description for existing procedure', async () => {
      const mockProc = {
        id: '1',
        toJSON: () => ({ nombre: 'Corte Premium', descripcion: 'Corte clásico', precio: 25000, duracion: 30 }),
      }
      ;(Servicio.findByPk as jest.Mock).mockResolvedValue(mockProc)
      const result = await service.getDescription('1')
      expect(result).toContain('Corte Premium')
      expect(result).toContain('30 minutos')
    })

    it('shows "Sin descripción" when descripcion is null', async () => {
      const mockProc = {
        id: '2',
        toJSON: () => ({ nombre: 'Servicio', descripcion: null, precio: 10000, duracion: 15 }),
      }
      ;(Servicio.findByPk as jest.Mock).mockResolvedValue(mockProc)
      const result = await service.getDescription('2')
      expect(result).toContain('Sin descripción')
    })
  })
})
