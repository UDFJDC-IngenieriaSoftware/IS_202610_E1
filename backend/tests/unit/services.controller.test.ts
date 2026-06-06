import * as servicesController from '../../src/controllers/services.controller'
import { HttpError } from '../../src/utils/http'

jest.mock('../../src/models', () => ({
  Servicio: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}))

import { Servicio } from '../../src/models'

function mockRes() {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

const mockService = {
  id: 'svc-1', nombre: 'Corte', duracion: 30, precio: 25000,
  activo: true, descripcion: 'Corte clásico', idBarbero: 'barber-1',
  update: jest.fn().mockResolvedValue({}),
}

describe('services.controller', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('listServices', () => {
    it('returns serialized list of services', async () => {
      ;(Servicio.findAll as jest.Mock).mockResolvedValue([mockService])
      const req = { auth: { sub: 'barber-1' }, query: {} } as any
      const res = mockRes()
      await servicesController.listServices(req, res)
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 'svc-1', nombre: 'Corte' })]),
      )
    })

    it('filters by activo=true when query param is set', async () => {
      ;(Servicio.findAll as jest.Mock).mockResolvedValue([])
      const req = { auth: { sub: 'barber-1' }, query: { activo: 'true' } } as any
      await servicesController.listServices(req, mockRes())
      expect(Servicio.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ activo: true }) }),
      )
    })

    it('returns empty array when no services', async () => {
      ;(Servicio.findAll as jest.Mock).mockResolvedValue([])
      const req = { auth: { sub: 'barber-1' }, query: {} } as any
      const res = mockRes()
      await servicesController.listServices(req, res)
      expect(res.json).toHaveBeenCalledWith([])
    })
  })

  describe('getService', () => {
    it('returns a single service', async () => {
      ;(Servicio.findOne as jest.Mock).mockResolvedValue(mockService)
      const req = { auth: { sub: 'barber-1' }, params: { id: 'svc-1' } } as any
      const res = mockRes()
      await servicesController.getService(req, res)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'svc-1' }))
    })

    it('throws 404 when service not found', async () => {
      ;(Servicio.findOne as jest.Mock).mockResolvedValue(null)
      const req = { auth: { sub: 'barber-1' }, params: { id: 'nonexistent' } } as any
      await expect(servicesController.getService(req, mockRes())).rejects.toThrow(HttpError)
    })
  })

  describe('createService', () => {
    it('creates and returns a new service with 201', async () => {
      ;(Servicio.create as jest.Mock).mockResolvedValue(mockService)
      const req = {
        auth: { sub: 'barber-1' },
        body: { nombre: 'Corte', duracion: 30, precio: 25000 },
      } as any
      const res = mockRes()
      await servicesController.createService(req, res)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'svc-1' }))
    })

    it('throws when nombre is missing', async () => {
      const req = { auth: { sub: 'b1' }, body: { duracion: 30, precio: 5000 } } as any
      await expect(servicesController.createService(req, mockRes())).rejects.toThrow(HttpError)
    })
  })

  describe('updateService', () => {
    it('updates service fields and returns updated service', async () => {
      ;(Servicio.findOne as jest.Mock).mockResolvedValue(mockService)
      const req = {
        auth: { sub: 'barber-1' },
        params: { id: 'svc-1' },
        body: { nombre: 'Corte Premium', precio: 30000 },
      } as any
      const res = mockRes()
      await servicesController.updateService(req, res)
      expect(mockService.update).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalled()
    })

    it('throws 404 when service does not belong to barber', async () => {
      ;(Servicio.findOne as jest.Mock).mockResolvedValue(null)
      const req = { auth: { sub: 'other-barber' }, params: { id: 'svc-1' }, body: {} } as any
      await expect(servicesController.updateService(req, mockRes())).rejects.toThrow(HttpError)
    })
  })

  describe('deleteService', () => {
    it('marks service inactive and returns 204', async () => {
      ;(Servicio.findOne as jest.Mock).mockResolvedValue(mockService)
      const req = { auth: { sub: 'barber-1' }, params: { id: 'svc-1' } } as any
      const res = mockRes()
      await servicesController.deleteService(req, res)
      expect(mockService.update).toHaveBeenCalledWith({ activo: false })
      expect(res.status).toHaveBeenCalledWith(204)
    })
  })

  describe('toggleService', () => {
    it('toggles activo flag', async () => {
      const service = { ...mockService, activo: true, update: jest.fn().mockResolvedValue({}) }
      ;(Servicio.findOne as jest.Mock).mockResolvedValue(service)
      const req = { auth: { sub: 'barber-1' }, params: { id: 'svc-1' } } as any
      const res = mockRes()
      await servicesController.toggleService(req, res)
      expect(service.update).toHaveBeenCalledWith({ activo: false })
    })
  })
})
