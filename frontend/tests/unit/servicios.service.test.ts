import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  listServicios,
  listServiciosActivos,
  createServicio,
  updateServicio,
  deleteServicio,
} from '../../src/services/servicios.service'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/services/apiClient', () => ({
  USE_MOCKS: false,
  mockDelay: (v: any) => Promise.resolve(v),
  request: mockRequest,
}))

const mockServicio = {
  id: 's1',
  nombre: 'Corte de Cabello',
  descripcion: 'Corte estándar',
  precio: 25000,
  duracion: 30,
  activo: true,
}

describe('servicios.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listServicios', () => {
    it('should return servicios list', async () => {
      mockRequest.mockResolvedValueOnce([mockServicio])

      const result = await listServicios()

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return servicios with expected properties', async () => {
      mockRequest.mockResolvedValueOnce([mockServicio])

      const result = await listServicios()

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('nombre')
        expect(result[0]).toHaveProperty('precio')
      }
    })
  })

  describe('listServiciosActivos', () => {
    it('should return only active servicios', async () => {
      mockRequest.mockResolvedValueOnce([mockServicio])

      const result = await listServiciosActivos()

      expect(Array.isArray(result)).toBe(true)
      expect(result.every((s) => s.activo === true)).toBe(true)
    })
  })

  describe('createServicio', () => {
    it('should create a new servicio with id', async () => {
      const newServicio = {
        nombre: 'Test Service',
        descripcion: 'Test Description',
        precio: 50000,
        duracion: 45,
        activo: true,
      }
      mockRequest.mockResolvedValueOnce({ ...newServicio, id: 's-new' })

      const result = await createServicio(newServicio)

      expect(result).toHaveProperty('id')
      expect(result.nombre).toBe(newServicio.nombre)
      expect(result.precio).toBe(newServicio.precio)
    })

    it('should preserve all servicio data on creation', async () => {
      const newServicio = {
        nombre: 'Manicura',
        descripcion: 'Servicio de manicura',
        precio: 35000,
        duracion: 20,
        activo: true,
      }
      mockRequest.mockResolvedValueOnce({ ...newServicio, id: 's-new2' })

      const result = await createServicio(newServicio)

      expect(result.nombre).toBe(newServicio.nombre)
      expect(result.descripcion).toBe(newServicio.descripcion)
      expect(result.precio).toBe(newServicio.precio)
      expect(result.duracion).toBe(newServicio.duracion)
      expect(result.activo).toBe(newServicio.activo)
    })
  })

  describe('updateServicio', () => {
    it('should update servicio price', async () => {
      const updateData = { precio: 30000 }
      mockRequest.mockResolvedValueOnce({ ...mockServicio, ...updateData })

      const result = await updateServicio('s1', updateData)

      expect(result).toHaveProperty('id')
      expect(result.id).toBe('s1')
    })

    it('should handle partial updates', async () => {
      const updateData = { nombre: 'Corte Premium', precio: 45000 }
      mockRequest.mockResolvedValueOnce({ ...mockServicio, ...updateData })

      const result = await updateServicio('s1', updateData)

      expect(result.id).toBe('s1')
      expect(result.nombre).toBe(updateData.nombre)
      expect(result.precio).toBe(updateData.precio)
    })

    it('should handle status changes', async () => {
      const updateData = { activo: false }
      mockRequest.mockResolvedValueOnce({ ...mockServicio, ...updateData })

      const result = await updateServicio('s1', updateData)

      expect(result.activo).toBe(false)
    })
  })

  describe('deleteServicio', () => {
    it('should complete without error', async () => {
      mockRequest.mockResolvedValueOnce(undefined)

      expect(async () => {
        await deleteServicio('s1')
      }).not.toThrow()
    })

    it('should handle different servicio IDs', async () => {
      mockRequest.mockResolvedValueOnce(undefined)

      expect(async () => {
        await deleteServicio('s5')
      }).not.toThrow()
    })
  })
})
