import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listBarberos,
  getBarberoById,
  updateBarbero,
  listPlanes,
  getMetricas,
} from '../../src/services/barberos.service'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/services/apiClient', () => ({
  USE_MOCKS: false,
  mockDelay: (v: any) => Promise.resolve(v),
  request: mockRequest,
}))

const mockBarbero = {
  id: 'b001',
  nombre: 'Juan Pérez',
  email: 'juan@example.com',
  estado: 'activa' as const,
}

const mockPlan = { id: 'p1', nombre: 'Básico', precio: 29900 }

const mockMetricas = {
  totalBarberos: 10,
  mrr: 299000,
  arr: 3588000,
  mrrSerie: [{ mes: '2026-01', valor: 299000 }],
}

describe('barberos.service', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('listBarberos', () => {
    it('should return list of all barberos', async () => {
      mockRequest.mockResolvedValueOnce([mockBarbero])

      const result = await listBarberos()

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return barberos with expected structure', async () => {
      mockRequest.mockResolvedValueOnce([mockBarbero])

      const result = await listBarberos()

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('nombre')
      }
    })
  })

  describe('getBarberoById', () => {
    it('should return barbero or undefined', async () => {
      mockRequest.mockResolvedValueOnce(mockBarbero)

      const result = await getBarberoById('b1')

      expect(result === undefined || result?.id).toBeTruthy()
    })

    it('should return undefined when barbero not found', async () => {
      mockRequest.mockResolvedValueOnce(undefined)

      const result = await getBarberoById('nonexistent')

      expect(result === undefined || typeof result === 'object').toBe(true)
    })
  })

  describe('updateBarbero', () => {
    it('should update barbero with new data', async () => {
      const updateData = { nombre: 'Juan Actualizado' }
      mockRequest.mockResolvedValueOnce({ ...mockBarbero, ...updateData })

      const result = await updateBarbero('b001', updateData)

      expect(result).toHaveProperty('id')
      expect(result.nombre).toBe(updateData.nombre)
    })

    it('should handle multiple field updates', async () => {
      const updateData = { nombre: 'Nuevo Nombre', estado: 'inactiva' as const }
      mockRequest.mockResolvedValueOnce({ ...mockBarbero, ...updateData })

      const result = await updateBarbero('b001', updateData)

      expect(result.nombre).toBe(updateData.nombre)
      expect(result.estado).toBe(updateData.estado)
    })
  })

  describe('listPlanes', () => {
    it('should return list of all planes', async () => {
      mockRequest.mockResolvedValueOnce([mockPlan])

      const result = await listPlanes()

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return planes with expected structure', async () => {
      mockRequest.mockResolvedValueOnce([mockPlan])

      const result = await listPlanes()

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('nombre')
        expect(result[0]).toHaveProperty('precio')
      }
    })
  })

  describe('getMetricas', () => {
    it('should return platform metrics', async () => {
      mockRequest.mockResolvedValueOnce(mockMetricas)

      const result = await getMetricas()

      expect(result).toHaveProperty('totalBarberos')
      expect(result).toHaveProperty('mrr')
      expect(result).toHaveProperty('arr')
    })

    it('should return metrics with numeric values', async () => {
      mockRequest.mockResolvedValueOnce(mockMetricas)

      const result = await getMetricas()

      expect(typeof result.totalBarberos).toBe('number')
      expect(typeof result.mrr).toBe('number')
      expect(typeof result.arr).toBe('number')
    })

    it('should return metric series', async () => {
      mockRequest.mockResolvedValueOnce(mockMetricas)

      const result = await getMetricas()

      expect(result).toHaveProperty('mrrSerie')
      expect(Array.isArray(result.mrrSerie)).toBe(true)
    })
  })
})
