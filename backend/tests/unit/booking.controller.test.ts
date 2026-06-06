import { HttpError } from '../../src/utils/http'

// mock* variables are hoisted by Jest so factories can reference them
const mockCreate = jest.fn()
const mockListForBarber = jest.fn()
const mockGetOwned = jest.fn()
const mockUpdateStatus = jest.fn()
const mockGetForService = jest.fn()
const mockCreatePaymentLink = jest.fn()
const mockSerializeBooking = jest.fn((b: any) => ({
  id: b.id ?? 'b1', estado: b.estado ?? 'pendiente', precio: b.precio ?? 30000,
  fecha: '2026-06-15', hora: '14:00', cliente: 'Juan García', servicio: 'Corte', duracion: 30, telefono: '300',
}))

jest.mock('../../src/models', () => ({
  Cita: {}, Cliente: {}, Horario: {}, Pago: {}, Servicio: {}, Barbero: {}, sequelize: { transaction: jest.fn() },
}))
jest.mock('../../src/services/booking.service', () => ({
  BookingService: jest.fn(() => ({ create: mockCreate, listForBarber: mockListForBarber, getOwned: mockGetOwned, updateStatus: mockUpdateStatus })),
  serializeBooking: mockSerializeBooking,
}))
jest.mock('../../src/services/availability.service', () => ({
  AvailabilityService: jest.fn(() => ({ getForService: mockGetForService })),
  fromMinutes: jest.fn(),
}))
jest.mock('../../src/services/payment.service', () => ({
  PaymentService: jest.fn(() => ({ createPaymentLink: mockCreatePaymentLink, serialize: jest.fn() })),
}))
jest.mock('../../src/services/notification.service', () => ({
  notificationService: { sendCancellation: jest.fn() },
}))

import * as bookingController from '../../src/controllers/booking.controller'

function mockRes() {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

const mockBooking = { id: 'b1', estado: 'pendiente', precio: 30000, idHorario: 'h1', idCliente: 'c1' }
const mockPayment = { id: 'p1', monto: 15000, estado: 'pendiente', referencia: 'MITURNO-b1' }

describe('booking.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetForService.mockResolvedValue([{ time: '09:00', available: true }])
    mockCreatePaymentLink.mockResolvedValue('https://checkout.wompi.co/l/abc')
    mockSerializeBooking.mockImplementation((b: any) => ({
      id: b.id ?? 'b1', estado: b.estado ?? 'pendiente', precio: b.precio ?? 30000,
      fecha: '2026-06-15', hora: '14:00', cliente: 'Juan', servicio: 'Corte', duracion: 30, telefono: '300',
    }))
  })

  describe('getAvailability', () => {
    it('returns available slots', async () => {
      const req = { body: { idServicio: 'svc-1', fecha: '2026-06-15' }, query: {} } as any
      const res = mockRes()
      await bookingController.getAvailability(req, res)
      expect(res.json).toHaveBeenCalledWith([{ time: '09:00', available: true }])
    })

    it('throws 400 when idServicio is missing', async () => {
      const req = { body: { fecha: '2026-06-15' }, query: {} } as any
      await expect(bookingController.getAvailability(req, mockRes())).rejects.toThrow(HttpError)
    })

    it('reads serviceId from query as fallback', async () => {
      mockGetForService.mockResolvedValue([])
      const req = { body: {}, query: { serviceId: 'svc-2', date: '2026-06-15' } } as any
      await bookingController.getAvailability(req, mockRes())
      expect(mockGetForService).toHaveBeenCalledWith('svc-2', '2026-06-15')
    })
  })

  describe('createBooking', () => {
    const validBody = {
      idServicio: 'svc-1', fecha: '2026-06-15', hora: '14:00',
      cliente: { nombres: 'Juan', apellidos: 'García', celular: '3001234567', email: 'juan@test.com' },
    }

    it('creates booking and returns 201', async () => {
      mockCreate.mockResolvedValue({ booking: mockBooking, payment: mockPayment })
      const res = mockRes()
      await bookingController.createBooking({ body: validBody } as any, res)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ payment: expect.any(Object) }))
    })

    it('still returns 201 when payment link fails', async () => {
      mockCreate.mockResolvedValue({ booking: mockBooking, payment: mockPayment })
      mockCreatePaymentLink.mockRejectedValue(new Error('Wompi down'))
      const res = mockRes()
      await bookingController.createBooking({ body: validBody } as any, res)
      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('throws 400 for invalid hora format', async () => {
      await expect(bookingController.createBooking(
        { body: { ...validBody, hora: '25:99' } } as any, mockRes(),
      )).rejects.toThrow(HttpError)
    })
  })

  describe('listBookings', () => {
    it('returns serialized list', async () => {
      mockListForBarber.mockResolvedValue([mockBooking])
      const res = mockRes()
      await bookingController.listBookings({ auth: { sub: 'barber-1' }, query: {} } as any, res)
      expect(res.json).toHaveBeenCalledWith(expect.any(Array))
    })

    it('passes date filters to service', async () => {
      mockListForBarber.mockResolvedValue([])
      const req = { auth: { sub: 'barber-1' }, query: { fecha: '2026-06-15', desde: '2026-06-01', hasta: '2026-06-30' } } as any
      await bookingController.listBookings(req, mockRes())
      expect(mockListForBarber).toHaveBeenCalledWith(
        'barber-1', expect.objectContaining({ fecha: '2026-06-15' }),
      )
    })
  })

  describe('getBooking', () => {
    it('returns the booking', async () => {
      mockGetOwned.mockResolvedValue(mockBooking)
      const res = mockRes()
      await bookingController.getBooking({ auth: { sub: 'barber-1' }, params: { id: 'b1' } } as any, res)
      expect(res.json).toHaveBeenCalled()
    })
  })

  describe('updateBooking', () => {
    it('updates booking status', async () => {
      mockUpdateStatus.mockResolvedValue({ ...mockBooking, estado: 'confirmada' })
      const req = { auth: { sub: 'barber-1' }, params: { id: 'b1' }, body: { estado: 'confirmada' } } as any
      await bookingController.updateBooking(req, mockRes())
      expect(mockUpdateStatus).toHaveBeenCalledWith('b1', 'barber-1', 'confirmada')
    })
  })

  describe('transitionBooking', () => {
    it('maps cancel → cancelada', async () => {
      mockUpdateStatus.mockResolvedValue({ ...mockBooking, estado: 'cancelada' })
      const req = { auth: { sub: 'barber-1' }, params: { id: 'b1', action: 'cancel' } } as any
      await bookingController.transitionBooking(req, mockRes())
      expect(mockUpdateStatus).toHaveBeenCalledWith('b1', 'barber-1', 'cancelada')
    })

    it('maps complete → completada', async () => {
      mockUpdateStatus.mockResolvedValue({ ...mockBooking, estado: 'completada' })
      const req = { auth: { sub: 'barber-1' }, params: { id: 'b1', action: 'complete' } } as any
      await bookingController.transitionBooking(req, mockRes())
      expect(mockUpdateStatus).toHaveBeenCalledWith('b1', 'barber-1', 'completada')
    })

    it('throws 400 for unknown action', async () => {
      const req = { auth: { sub: 'barber-1' }, params: { id: 'b1', action: 'fly' } } as any
      await expect(bookingController.transitionBooking(req, mockRes())).rejects.toThrow(HttpError)
    })
  })

  describe('bookingStats', () => {
    it('returns aggregated stats', async () => {
      const list = [
        { id: '1', estado: 'completada', precio: 50000 },
        { id: '2', estado: 'confirmada', precio: 30000 },
        { id: '3', estado: 'cancelada', precio: 20000 },
      ]
      mockListForBarber.mockResolvedValue(list)
      const res = mockRes()
      await bookingController.bookingStats({ auth: { sub: 'barber-1' } } as any, res)
      const stats = res.json.mock.calls[0][0]
      expect(stats.total).toBe(3)
      expect(stats).toHaveProperty('completadas')
      expect(stats).toHaveProperty('ingresos')
    })
  })
})
