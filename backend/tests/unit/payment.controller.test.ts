import { HttpError } from '../../src/utils/http'

const mockGetOwned = jest.fn()
const mockCreatePaymentLink = jest.fn()
const mockRefundPayment = jest.fn()
const mockHandleEvent = jest.fn()
const mockSerialize = jest.fn((p: any, url?: any) => ({ id: p.id, bookingId: p.idCita, amount: p.monto, status: p.estado, paymentUrl: url ?? null }))

jest.mock('../../src/models', () => ({
  Pago: { findOne: jest.fn(), findByPk: jest.fn() },
  Cita: {}, Cliente: {}, Horario: {}, Servicio: {}, Barbero: {}, sequelize: { transaction: jest.fn() },
}))
jest.mock('../../src/services/booking.service', () => ({
  BookingService: jest.fn(() => ({ getOwned: mockGetOwned })),
  serializeBooking: jest.fn(),
}))
jest.mock('../../src/services/payment.service', () => ({
  PaymentService: jest.fn(() => ({
    createPaymentLink: mockCreatePaymentLink,
    refundPayment: mockRefundPayment,
    handleEvent: mockHandleEvent,
    serialize: mockSerialize,
  })),
}))
jest.mock('../../src/services/availability.service', () => ({
  AvailabilityService: jest.fn(() => ({})),
  fromMinutes: jest.fn(),
}))
jest.mock('../../src/services/notification.service', () => ({
  notificationService: {},
}))

import * as paymentController from '../../src/controllers/payment.controller'
import { Pago } from '../../src/models'

function mockRes() {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

const mockPayment = { id: 'p1', idCita: 'b1', monto: 15000, estado: 'pendiente', referencia: 'R1' }
const mockBooking = { id: 'b1', estado: 'pendiente', precio: 30000, idHorario: 'h1', idCliente: 'c1' }

describe('payment.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSerialize.mockImplementation((p: any, url?: any) => ({
      id: p.id, bookingId: p.idCita, amount: p.monto, status: p.estado, paymentUrl: url ?? null,
    }))
  })

  describe('getPayment', () => {
    it('returns serialized payment', async () => {
      ;(Pago.findOne as jest.Mock).mockResolvedValue(mockPayment)
      mockGetOwned.mockResolvedValue(mockBooking)
      const req = { auth: { sub: 'barber-1' }, params: { bookingId: 'b1' }, body: {} } as any
      const res = mockRes()
      await paymentController.getPayment(req, res)
      expect(res.json).toHaveBeenCalled()
    })

    it('throws 404 when payment not found', async () => {
      mockGetOwned.mockResolvedValue(mockBooking)
      ;(Pago.findOne as jest.Mock).mockResolvedValue(null)
      const req = { auth: { sub: 'barber-1' }, params: { bookingId: 'b1' }, body: {} } as any
      await expect(paymentController.getPayment(req, mockRes())).rejects.toThrow(HttpError)
    })
  })

  describe('createPaymentLink', () => {
    it('returns payment with link URL', async () => {
      mockGetOwned.mockResolvedValue(mockBooking)
      ;(Pago.findOne as jest.Mock).mockResolvedValue(mockPayment)
      mockCreatePaymentLink.mockResolvedValue('https://checkout.wompi.co/l/abc')
      const req = { auth: { sub: 'barber-1' }, params: { bookingId: 'b1' }, body: {} } as any
      const res = mockRes()
      await paymentController.createPaymentLink(req, res)
      expect(res.json).toHaveBeenCalled()
    })

    it('throws 503 when wompi is not configured', async () => {
      mockGetOwned.mockResolvedValue(mockBooking)
      ;(Pago.findOne as jest.Mock).mockResolvedValue(mockPayment)
      mockCreatePaymentLink.mockResolvedValue(null)
      const req = { auth: { sub: 'barber-1' }, params: { bookingId: 'b1' }, body: {} } as any
      await expect(paymentController.createPaymentLink(req, mockRes())).rejects.toThrow(HttpError)
    })
  })

  describe('refundPayment', () => {
    it('returns success on refund', async () => {
      ;(Pago.findByPk as jest.Mock).mockResolvedValue(mockPayment)
      mockGetOwned.mockResolvedValue(mockBooking)
      mockRefundPayment.mockResolvedValue(undefined)
      const req = { auth: { sub: 'barber-1' }, params: { paymentId: 'p1' }, body: {} } as any
      const res = mockRes()
      await paymentController.refundPayment(req, res)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })

    it('throws 404 when payment not found', async () => {
      ;(Pago.findByPk as jest.Mock).mockResolvedValue(null)
      const req = { auth: { sub: 'barber-1' }, params: { paymentId: 'missing' }, body: {} } as any
      await expect(paymentController.refundPayment(req, mockRes())).rejects.toThrow(HttpError)
    })
  })

  describe('paymentWebhook', () => {
    it('handles valid webhook event', async () => {
      mockHandleEvent.mockResolvedValue(undefined)
      const req = {
        body: { event: 'transaction.updated', data: {}, signature: {}, timestamp: 123, sent_at: '' },
        headers: {},
      } as any
      const res = mockRes()
      await paymentController.paymentWebhook(req, res)
      expect(res.json).toHaveBeenCalledWith({ received: true })
    })

    it('passes x-event-checksum header to handleEvent', async () => {
      mockHandleEvent.mockResolvedValue(undefined)
      const req = {
        body: { event: 'transaction.updated', data: {}, signature: {}, timestamp: 123, sent_at: '' },
        headers: { 'x-event-checksum': 'ABC123' },
      } as any
      await paymentController.paymentWebhook(req, mockRes())
      expect(mockHandleEvent).toHaveBeenCalledWith(expect.any(Object), 'ABC123')
    })
  })
})
