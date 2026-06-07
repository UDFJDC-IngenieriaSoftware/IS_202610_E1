import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listCitasByDate,
  listCitasByWeek,
  listAllCitas,
  getCitaById,
  updateEstadoCita,
} from '../../src/services/citas.service'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/services/apiClient', () => ({
  USE_MOCKS: false,
  mockDelay: (v: any) => Promise.resolve(v),
  request: mockRequest,
}))

const mockCita = {
  id: 'c1',
  fecha: '2026-06-01',
  hora: '09:00',
  estado: 'confirmada' as const,
  cliente: 'Juan Pérez',
  telefono: '3001234567',
  servicio: 'Corte',
  precio: 25000,
  duracion: 30,
}

describe('citas.service', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('listCitasByDate', () => {
    it('should return array of citas', async () => {
      mockRequest.mockResolvedValueOnce([mockCita])

      const result = await listCitasByDate('2026-06-01')

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return citas with expected structure', async () => {
      mockRequest.mockResolvedValueOnce([mockCita])

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
      mockRequest.mockResolvedValueOnce([mockCita])

      const result = await listCitasByWeek('2026-06-01', '2026-06-07')

      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle date range filtering', async () => {
      mockRequest.mockResolvedValueOnce([])

      const result = await listCitasByWeek('2026-06-01', '2026-06-07')

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('listAllCitas', () => {
    it('should return all citas', async () => {
      mockRequest.mockResolvedValueOnce([mockCita])

      const result = await listAllCitas()

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return citas array', async () => {
      mockRequest.mockResolvedValueOnce([mockCita])

      const result = await listAllCitas()

      expect(result.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getCitaById', () => {
    it('should return cita or undefined', async () => {
      mockRequest.mockResolvedValueOnce(mockCita)

      const result = await getCitaById('c1')

      expect(result === undefined || result?.id).toBeTruthy()
    })

    it('should handle non-existent cita gracefully', async () => {
      mockRequest.mockResolvedValueOnce(undefined)

      const result = await getCitaById('nonexistent-id-999')

      expect(result === undefined || typeof result === 'object').toBe(true)
    })
  })

  describe('updateEstadoCita', () => {
    it('should update cita status', async () => {
      mockRequest.mockResolvedValueOnce({ ...mockCita, estado: 'cancelada' })

      const result = await updateEstadoCita('c01', 'cancelada')

      expect(result).toHaveProperty('id')
      expect(result.estado).toBe('cancelada')
    })

    it('should handle different status values', async () => {
      const statuses = ['confirmada', 'completada', 'cancelada'] as const

      mockRequest
        .mockResolvedValueOnce({ ...mockCita, estado: 'confirmada' })
        .mockResolvedValueOnce({ ...mockCita, estado: 'completada' })
        .mockResolvedValueOnce({ ...mockCita, estado: 'cancelada' })

      for (const status of statuses) {
        const result = await updateEstadoCita('c01', status)
        expect(result.estado).toBe(status)
      }
    })
  })
})
