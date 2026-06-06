import { HttpError } from '../../src/utils/http'

jest.mock('../../src/models', () => ({
  Cliente: { findAll: jest.fn(), findOne: jest.fn() },
  Cita: {},
  Horario: {},
  Servicio: {},
}))

import * as customerController from '../../src/controllers/customer.controller'
import { Cliente } from '../../src/models'

function mockRes() {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const mockCustomer = {
  id: 'c1', nombres: 'Juan', apellidos: 'García', email: 'juan@test.com', celular: '3001234567',
  update: jest.fn().mockResolvedValue({}),
}

describe('customer.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCustomer.update.mockResolvedValue({})
  })

  describe('listCustomers', () => {
    it('returns serialized customers list', async () => {
      ;(Cliente.findAll as jest.Mock).mockResolvedValue([mockCustomer])
      const req = { auth: { sub: 'barber-1' } } as any
      const res = mockRes()
      await customerController.listCustomers(req, res)
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 'c1', nombres: 'Juan' })]),
      )
    })

    it('returns empty list when no customers', async () => {
      ;(Cliente.findAll as jest.Mock).mockResolvedValue([])
      const res = mockRes()
      await customerController.listCustomers({ auth: { sub: 'barber-1' } } as any, res)
      expect(res.json).toHaveBeenCalledWith([])
    })
  })

  describe('getCustomer', () => {
    it('returns serialized customer', async () => {
      ;(Cliente.findOne as jest.Mock).mockResolvedValue(mockCustomer)
      const req = { auth: { sub: 'barber-1' }, params: { id: 'c1' } } as any
      const res = mockRes()
      await customerController.getCustomer(req, res)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' }))
    })

    it('throws 404 when customer not found', async () => {
      ;(Cliente.findOne as jest.Mock).mockResolvedValue(null)
      const req = { auth: { sub: 'barber-1' }, params: { id: 'missing' } } as any
      await expect(customerController.getCustomer(req, mockRes())).rejects.toThrow(HttpError)
    })
  })

  describe('updateCustomer', () => {
    it('updates and returns customer', async () => {
      ;(Cliente.findOne as jest.Mock).mockResolvedValue(mockCustomer)
      const req = {
        auth: { sub: 'barber-1' }, params: { id: 'c1' },
        body: { nombres: 'Juan Carlos' },
      } as any
      const res = mockRes()
      await customerController.updateCustomer(req, res)
      expect(mockCustomer.update).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalled()
    })
  })
})
