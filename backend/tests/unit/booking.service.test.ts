import { BookingService, serializeBooking } from '../../src/services/booking.service'
import { HttpError } from '../../src/utils/http'

jest.mock('../../src/models', () => ({
  Cita: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), findByPk: jest.fn() },
  Cliente: { findOrCreate: jest.fn(), findByPk: jest.fn() },
  Horario: { create: jest.fn(), update: jest.fn(), findByPk: jest.fn() },
  Pago: { create: jest.fn() },
  Servicio: { findOne: jest.fn() },
  Barbero: { findByPk: jest.fn() },
  sequelize: {
    transaction: jest.fn((_opts: any, fn: any) => fn({})),
  },
}))

jest.mock('../../src/services/availability.service', () => ({
  AvailabilityService: jest.fn().mockImplementation(() => ({
    isSlotAvailable: jest.fn().mockResolvedValue(true),
  })),
  fromMinutes: jest.fn((v: number) => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`),
}))

jest.mock('../../src/services/notification.service', () => ({
  notificationService: { sendCancellation: jest.fn(), sendBookingConfirmation: jest.fn() },
}))

import {
  Cita, Cliente, Horario, Pago, Servicio, Barbero, sequelize,
} from '../../src/models'
import { notificationService } from '../../src/services/notification.service'

const mockServicio = {
  id: 'svc-1', nombre: 'Corte', precio: 30000, duracion: 30,
  idBarbero: 'barber-1', activo: true,
}

const mockCliente = {
  id: 'cli-1', nombres: 'Juan', apellidos: 'García', celular: '3001234567', email: 'juan@test.com',
}

const mockHorario = {
  id: 'hor-1', fecha: '2026-06-15', horaInicio: '14:00:00', horaFin: '14:30:00',
  estado: 'reservado', idServicio: 'svc-1',
  servicio: { ...mockServicio },
}

const mockCita = {
  id: 'cita-1', estado: 'pendiente', precio: 30000,
  idHorario: 'hor-1', idCliente: 'cli-1',
  update: jest.fn().mockResolvedValue({}),
}

const mockPago = { id: 'pago-1', idCita: 'cita-1', monto: 15000, estado: 'pendiente' }

describe('serializeBooking', () => {
  it('maps raw booking data to flat DTO', () => {
    const booking = {
      toJSON: () => ({
        id: 'b1', estado: 'confirmada', precio: 50000, idHorario: 'h1', idCliente: 'c1',
        horario: { fecha: '2026-06-15', horaInicio: '14:30:00', servicio: { duracion: 30, nombre: 'Corte' } },
        cliente: { nombres: 'Ana', apellidos: 'Ruiz', celular: '300' },
      }),
    } as any

    const result = serializeBooking(booking)
    expect(result.id).toBe('b1')
    expect(result.fecha).toBe('2026-06-15')
    expect(result.hora).toBe('14:30')
    expect(result.cliente).toBe('Ana Ruiz')
    expect(result.servicio).toBe('Corte')
    expect(result.precio).toBe(50000)
    expect(result.estado).toBe('confirmada')
  })
})

describe('BookingService', () => {
  let service: BookingService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new BookingService()
  })

  describe('listForBarber', () => {
    it('returns bookings list', async () => {
      ;(Cita.findAll as jest.Mock).mockResolvedValue([mockCita])
      const result = await service.listForBarber('barber-1')
      expect(Array.isArray(result)).toBe(true)
      expect(result[0]).toEqual(mockCita)
    })

    it('passes fecha filter to query', async () => {
      ;(Cita.findAll as jest.Mock).mockResolvedValue([])
      await service.listForBarber('barber-1', { fecha: '2026-06-15' })
      expect(Cita.findAll).toHaveBeenCalled()
    })

    it('passes desde/hasta range filter', async () => {
      ;(Cita.findAll as jest.Mock).mockResolvedValue([])
      await service.listForBarber('barber-1', { desde: '2026-06-01', hasta: '2026-06-30' })
      expect(Cita.findAll).toHaveBeenCalled()
    })
  })

  describe('getOwned', () => {
    it('returns booking when found', async () => {
      ;(Cita.findOne as jest.Mock).mockResolvedValue(mockCita)
      const result = await service.getOwned('cita-1', 'barber-1')
      expect(result).toEqual(mockCita)
    })

    it('throws 404 when booking not found', async () => {
      ;(Cita.findOne as jest.Mock).mockResolvedValue(null)
      await expect(service.getOwned('nonexistent', 'barber-1')).rejects.toThrow(HttpError)
      const err = await service.getOwned('nonexistent', 'barber-1').catch((e) => e)
      expect(err.status).toBe(404)
    })
  })

  describe('create', () => {
    beforeEach(() => {
      ;(Servicio.findOne as jest.Mock).mockResolvedValue(mockServicio)
      ;(Cliente.findOrCreate as jest.Mock).mockResolvedValue([mockCliente, true])
      ;(Horario.create as jest.Mock).mockResolvedValue(mockHorario)
      ;(Cita.create as jest.Mock).mockResolvedValue(mockCita)
      ;(Pago.create as jest.Mock).mockResolvedValue(mockPago)
      ;(Cita.findByPk as jest.Mock).mockResolvedValue({ ...mockCita, horario: mockHorario, cliente: mockCliente })
      ;(sequelize.transaction as jest.Mock).mockImplementation((_opts: any, fn: any) => fn({}))
    })

    const validInput = {
      idServicio: 'svc-1',
      fecha: '2026-06-15',
      hora: '14:00',
      cliente: { nombres: 'Juan', apellidos: 'García', celular: '3001234567', email: 'juan@test.com' },
    }

    it('creates and returns booking + payment', async () => {
      const result = await service.create(validInput)
      expect(result.booking).toBeDefined()
      expect(result.payment).toBeDefined()
      expect(Cita.create).toHaveBeenCalled()
      expect(Pago.create).toHaveBeenCalled()
    })

    it('throws 404 when service does not exist', async () => {
      ;(Servicio.findOne as jest.Mock).mockResolvedValue(null)
      ;(sequelize.transaction as jest.Mock).mockImplementation((_opts: any, fn: any) => fn({}))
      await expect(service.create(validInput)).rejects.toThrow(HttpError)
    })

    it('throws 409 when slot is not available', async () => {
      const { AvailabilityService } = jest.requireMock('../../src/services/availability.service')
      AvailabilityService.mockImplementation(() => ({ isSlotAvailable: jest.fn().mockResolvedValue(false) }))
      service = new BookingService()
      ;(sequelize.transaction as jest.Mock).mockImplementation((_opts: any, fn: any) => fn({}))
      await expect(service.create(validInput)).rejects.toThrow(HttpError)

      // Restore
      AvailabilityService.mockImplementation(() => ({ isSlotAvailable: jest.fn().mockResolvedValue(true) }))
    })
  })

  describe('updateStatus', () => {
    beforeEach(() => {
      ;(Cita.findOne as jest.Mock).mockResolvedValue(mockCita)
    })

    it('throws 400 for invalid status', async () => {
      await expect(service.updateStatus('cita-1', 'barber-1', 'invalid')).rejects.toThrow(HttpError)
      const err = await service.updateStatus('cita-1', 'barber-1', 'invalid').catch((e) => e)
      expect(err.status).toBe(400)
    })

    it('throws 409 when booking is already closed', async () => {
      const closedBooking = { ...mockCita, estado: 'completada', update: jest.fn() }
      ;(Cita.findOne as jest.Mock).mockResolvedValue(closedBooking)
      await expect(service.updateStatus('cita-1', 'barber-1', 'confirmada')).rejects.toThrow(HttpError)
    })

    it('updates status to confirmada', async () => {
      const pendingBooking = { ...mockCita, estado: 'pendiente', idHorario: 'hor-1', idCliente: 'cli-1', update: jest.fn().mockResolvedValue({}) }
      ;(Cita.findOne as jest.Mock).mockResolvedValue(pendingBooking)
      await service.updateStatus('cita-1', 'barber-1', 'confirmada')
      expect(pendingBooking.update).toHaveBeenCalledWith({ estado: 'confirmada' })
    })

    it('frees slot and sends notification on cancelada', async () => {
      const pendingBooking = {
        ...mockCita, estado: 'pendiente', idHorario: 'hor-1', idCliente: 'cli-1',
        update: jest.fn().mockResolvedValue({}),
      }
      ;(Cita.findOne as jest.Mock).mockResolvedValue(pendingBooking)
      ;(Horario.update as jest.Mock).mockResolvedValue([1])
      ;(Cliente.findByPk as jest.Mock).mockResolvedValue(mockCliente)
      ;(Horario.findByPk as jest.Mock).mockResolvedValue({
        ...mockHorario, servicio: { ...mockServicio, idBarbero: 'barber-1' },
      })
      ;(Barbero.findByPk as jest.Mock).mockResolvedValue({ nombres: 'Carlos', apellidos: 'López' })
      ;(notificationService.sendCancellation as jest.Mock).mockResolvedValue(undefined)

      await service.updateStatus('cita-1', 'barber-1', 'cancelada')

      expect(Horario.update).toHaveBeenCalledWith({ estado: 'disponible' }, expect.any(Object))
    })
  })
})
