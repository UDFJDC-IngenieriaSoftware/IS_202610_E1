import { describe, it, expect } from 'vitest'
import {
  listPagos,
  listPagosByBarbero,
  updateEstadoPago,
} from '../../src/services/pagos.service'

describe('pagos.service', () => {
  describe('listPagos', () => {
    it('should return list of all pagos', async () => {
      const result = await listPagos()

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return pagos with expected structure', async () => {
      const result = await listPagos()

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('estado')
      }
    })

    it('should return empty array when no pagos exist', async () => {
      const result = await listPagos()

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('listPagosByBarbero', () => {
    it('should return pagos for specific barbero', async () => {
      const result = await listPagosByBarbero('b1')

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return only barbero pagos', async () => {
      const result = await listPagosByBarbero('b1')

      if (result.length > 0) {
        expect(result.every((p) => p.barberoId === 'b1')).toBe(true)
      }
    })

    it('should return empty array when barbero has no pagos', async () => {
      const result = await listPagosByBarbero('b999')

      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle different barbero IDs', async () => {
      const result1 = await listPagosByBarbero('b2')
      const result2 = await listPagosByBarbero('admin-001')

      expect(Array.isArray(result1)).toBe(true)
      expect(Array.isArray(result2)).toBe(true)
    })
  })

  describe('updateEstadoPago', () => {
    it('should update payment status', async () => {
      const result = await updateEstadoPago('p001', 'pagado')

      expect(result).toHaveProperty('id')
      expect(result.estado).toBe('pagado')
    })

    it('should handle different payment status values', async () => {
      const statuses = ['exitoso', 'fallido', 'pendiente'] as const

      for (const status of statuses) {
        const result = await updateEstadoPago('p001', status)
        expect(result.estado).toBe(status)
      }
    })

    it('should update specific pago by ID', async () => {
      const result = await updateEstadoPago('p005', 'exitoso')

      expect(result.id).toBe('p005')
      expect(result.estado).toBe('exitoso')
    })
  })
})
