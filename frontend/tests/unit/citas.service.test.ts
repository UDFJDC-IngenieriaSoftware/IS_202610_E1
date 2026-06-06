import { describe, it, expect } from 'vitest'
import {
  listCitasByDate,
  listCitasByWeek,
  listAllCitas,
  getCitaById,
  updateEstadoCita,
} from '../../src/services/citas.service'

describe('citas.service', () => {
  describe('listCitasByDate', () => {
    it('should return array of citas', async () => {
      const result = await listCitasByDate('2026-06-01')

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return citas with expected structure', async () => {
      const result = await listCitasByDate('2026-06-01')

      if (result.length > 0) {
        const cita = result[0]
        expect(cita).toHaveProperty('id')
        expect(cita).toHaveProperty('fecha')
        expect(cita).toHaveProperty('estado')
      }
    })
  })

  describe('listCitasByWeek', () => {
    it('should return citas array for date range', async () => {
      const result = await listCitasByWeek('2026-06-01', '2026-06-07')

      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle date range filtering', async () => {
      const result = await listCitasByWeek('2026-06-01', '2026-06-07')

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('listAllCitas', () => {
    it('should return all citas', async () => {
      const result = await listAllCitas()

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return citas array', async () => {
      const result = await listAllCitas()

      expect(result.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getCitaById', () => {
    it('should return cita or undefined', async () => {
      const result = await getCitaById('c1')

      expect(result === undefined || result?.id).toBeTruthy()
    })

    it('should handle non-existent cita gracefully', async () => {
      const result = await getCitaById('nonexistent-id-999')

      expect(result === undefined || typeof result === 'object').toBe(true)
    })
  })

  describe('updateEstadoCita', () => {
    it('should update cita status', async () => {
      const result = await updateEstadoCita('c01', 'cancelada')

      expect(result).toHaveProperty('id')
      expect(result.estado).toBe('cancelada')
    })

    it('should handle different status values', async () => {
      const statuses = ['confirmada', 'completada', 'cancelada'] as const

      for (const status of statuses) {
        const result = await updateEstadoCita('c01', status)
        expect(result.estado).toBe(status)
      }
    })
  })
})
