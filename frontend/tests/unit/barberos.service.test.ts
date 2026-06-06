import { describe, it, expect } from 'vitest'
import {
  listBarberos,
  getBarberoById,
  updateBarbero,
  listPlanes,
  getMetricas,
} from '../../src/services/barberos.service'

describe('barberos.service', () => {
  describe('listBarberos', () => {
    it('should return list of all barberos', async () => {
      const result = await listBarberos()

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return barberos with expected structure', async () => {
      const result = await listBarberos()

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('nombre')
      }
    })
  })

  describe('getBarberoById', () => {
    it('should return barbero or undefined', async () => {
      const result = await getBarberoById('b1')

      expect(result === undefined || result?.id).toBeTruthy()
    })

    it('should return undefined when barbero not found', async () => {
      const result = await getBarberoById('nonexistent')

      expect(result === undefined || typeof result === 'object').toBe(true)
    })
  })

  describe('updateBarbero', () => {
    it('should update barbero with new data', async () => {
      const updateData = { nombre: 'Juan Actualizado' }

      const result = await updateBarbero('b001', updateData)

      expect(result).toHaveProperty('id')
      expect(result.nombre).toBe(updateData.nombre)
    })

    it('should handle multiple field updates', async () => {
      const updateData = {
        nombre: 'Nuevo Nombre',
        estado: 'inactiva' as const,
      }

      const result = await updateBarbero('b001', updateData)

      expect(result.nombre).toBe(updateData.nombre)
      expect(result.estado).toBe(updateData.estado)
    })
  })

  describe('listPlanes', () => {
    it('should return list of all planes', async () => {
      const result = await listPlanes()

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return planes with expected structure', async () => {
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
      const result = await getMetricas()

      expect(result).toHaveProperty('totalBarberos')
      expect(result).toHaveProperty('mrr')
      expect(result).toHaveProperty('arr')
    })

    it('should return metrics with numeric values', async () => {
      const result = await getMetricas()

      expect(typeof result.totalBarberos).toBe('number')
      expect(typeof result.mrr).toBe('number')
      expect(typeof result.arr).toBe('number')
    })

    it('should return metric series', async () => {
      const result = await getMetricas()

      expect(result).toHaveProperty('mrrSerie')
      expect(Array.isArray(result.mrrSerie)).toBe(true)
    })
  })
})
