import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listPagos,
  listPagosByBarbero,
  updateEstadoPago,
} from '../../src/services/pagos.service'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/services/apiClient', () => ({
  USE_MOCKS: false,
  mockDelay: (v: any) => Promise.resolve(v),
  request: mockRequest,
}))

const mockPago = {
  id: 'p001',
  estado: 'pendiente' as const,
  monto: 12500,
  barberoId: 'b1',
  citaId: 'c001',
}

describe('pagos.service', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('listPagos', () => {
    it('should return list of all pagos', async () => {
      mockRequest.mockResolvedValueOnce([mockPago])

      const result = await listPagos()

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return pagos with expected structure', async () => {
      mockRequest.mockResolvedValueOnce([mockPago])

      const result = await listPagos()

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('estado')
      }
    })

    it('should return empty array when no pagos exist', async () => {
      mockRequest.mockResolvedValueOnce([])

      const result = await listPagos()

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('listPagosByBarbero', () => {
    it('should return pagos for specific barbero', async () => {
      mockRequest.mockResolvedValueOnce([mockPago])

      const result = await listPagosByBarbero('b1')

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return only barbero pagos', async () => {
      mockRequest.mockResolvedValueOnce([mockPago])

      const result = await listPagosByBarbero('b1')

      if (result.length > 0) {
        expect(result.every((p) => p.barberoId === 'b1')).toBe(true)
      }
    })

    it('should return empty array when barbero has no pagos', async () => {
      mockRequest.mockResolvedValueOnce([])

      const result = await listPagosByBarbero('b999')

      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle different barbero IDs', async () => {
      mockRequest
        .mockResolvedValueOnce([{ ...mockPago, barberoId: 'b2' }])
        .mockResolvedValueOnce([{ ...mockPago, barberoId: 'admin-001' }])

      const result1 = await listPagosByBarbero('b2')
      const result2 = await listPagosByBarbero('admin-001')

      expect(Array.isArray(result1)).toBe(true)
      expect(Array.isArray(result2)).toBe(true)
    })
  })

  describe('updateEstadoPago', () => {
    it('should update payment status', async () => {
      mockRequest.mockResolvedValueOnce({ ...mockPago, estado: 'pagado' })

      const result = await updateEstadoPago('p001', 'pagado')

      expect(result).toHaveProperty('id')
      expect(result.estado).toBe('pagado')
    })

    it('should handle different payment status values', async () => {
      const statuses = ['exitoso', 'fallido', 'pendiente'] as const

      mockRequest
        .mockResolvedValueOnce({ ...mockPago, estado: 'exitoso' })
        .mockResolvedValueOnce({ ...mockPago, estado: 'fallido' })
        .mockResolvedValueOnce({ ...mockPago, estado: 'pendiente' })

      for (const status of statuses) {
        const result = await updateEstadoPago('p001', status)
        expect(result.estado).toBe(status)
      }
    })

    it('should update specific pago by ID', async () => {
      mockRequest.mockResolvedValueOnce({ ...mockPago, id: 'p005', estado: 'exitoso' })

      const result = await updateEstadoPago('p005', 'exitoso')

      expect(result.id).toBe('p005')
      expect(result.estado).toBe('exitoso')
    })
  })
})
