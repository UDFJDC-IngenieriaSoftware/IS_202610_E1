/**
 * Tests for bot.handlers.ts — Phase 1 implementation.
 * Verifies CU-01/02/03/05 handlers using AvailabilityService + BookingService.
 */

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

const mockGetAllBarbers   = jest.fn()
const mockGetProcedures   = jest.fn()
const mockGetServicesMenuText = jest.fn()
const mockGetAvailableSlots   = jest.fn()
const mockBookingCreate   = jest.fn()
const mockListForCliente  = jest.fn()
const mockUpdateStatus    = jest.fn()
const mockReschedule      = jest.fn()
const mockCreatePaymentLink = jest.fn()
const mockBarberoFindByPk = jest.fn()

jest.mock('../../src/services/barber.service', () => ({
  BarberService: jest.fn(() => ({
    getAllBarbers: mockGetAllBarbers,
    getProcedures: mockGetProcedures,
  })),
}))

jest.mock('../../src/services/procedure.service', () => ({
  ProcedureService: jest.fn(() => ({
    getServicesMenuText: mockGetServicesMenuText,
  })),
}))

jest.mock('../../src/services/availability.service', () => ({
  AvailabilityService: jest.fn(() => ({
    getAvailableSlots: mockGetAvailableSlots,
  })),
  fromMinutes: jest.fn((min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
  }),
}))

jest.mock('../../src/services/booking.service', () => ({
  BookingService: jest.fn(() => ({
    create: mockBookingCreate,
    listForCliente: mockListForCliente,
    updateStatus: mockUpdateStatus,
    reschedule: mockReschedule,
  })),
}))

jest.mock('../../src/services/payment.service', () => ({
  PaymentService: jest.fn(() => ({ createPaymentLink: mockCreatePaymentLink })),
}))

jest.mock('../../src/services/session.service', () => ({
  deleteSession: jest.fn(),
  getOrCreateSession: jest.fn(),
  saveSession: jest.fn(),
}))

jest.mock('../../src/models', () => ({
  Servicio: jest.fn(),
  Cliente: jest.fn(),
  Barbero: { findByPk: mockBarberoFindByPk },
  Horario: jest.fn(),
  Cita: jest.fn(),
  Pago: jest.fn(),
}))

jest.mock('../../src/utils/logger', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}))

// ─── Imports ──────────────────────────────────────────────────────────────────

import { StateHandlers } from '../../src/controllers/bot.handlers'
import { BotState, UserSession } from '../../src/controllers/bot.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<UserSession> = {}): UserSession {
  return {
    telefono: '3001234567',
    estadoActual: BotState.INICIO,
    datosTemporales: {},
    ...overrides,
  }
}

const mockUser = { id: 'u1', nombres: 'Pedro', apellidos: 'García', email: 'pedro@test.com' }

const mockBarbers = [
  { id: 'b1', nombres: 'Juan', apellidos: 'Pérez' },
  { id: 'b2', nombres: 'Luis', apellidos: 'Gómez' },
]

const mockProcedures = [
  {
    id: 's1', nombre: 'Corte', precio: 25000, duracion: 30, idBarbero: 'b1',
    barbero: { id: 'b1', nombres: 'Juan', apellidos: 'Pérez' },
    descripcion: 'Corte moderno',
  },
]

const availableSlots = [
  { time: '09:00', available: true },
  { time: '10:00', available: true },
]

// Cita mock returned by bookingService.listForCliente
const mockCitaRaw = {
  id: 'cita-1',
  estado: 'confirmada',
  toJSON: () => ({
    id: 'cita-1',
    estado: 'confirmada',
    horario: {
      fecha: '2099-07-20',
      horaInicio: '09:00:00',
      servicio: { id: 's1', nombre: 'Corte', precio: 25000, duracion: 30, idBarbero: 'b1' },
    },
  }),
}

// Pre-indexed cita as stored in session.datosTemporales.citasActivas
const indexedCita = {
  idx: 1,
  id: 'cita-1',
  estado: 'confirmada',
  horario: {
    fecha: '2099-07-20',
    horaInicio: '09:00:00',
    servicio: { id: 's1', nombre: 'Corte', precio: 25000, duracion: 30, idBarbero: 'b1' },
  },
}

// ─── INICIO ───────────────────────────────────────────────────────────────────

describe('handleInicio', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns welcome message for unrecognized input', async () => {
    const session = makeSession()
    const result = await StateHandlers[BotState.INICIO](session, 'hola')
    expect(result).toContain('Hola')
    expect(result).toContain('MiTurno')
    expect(session.estadoActual).toBe(BotState.INICIO)
  })

  it('input "1" shows barber list and transitions to SELECT_BARBER', async () => {
    mockGetAllBarbers.mockResolvedValue(mockBarbers)
    const session = makeSession()
    const result = await StateHandlers[BotState.INICIO](session, '1')
    expect(result).toContain('Juan')
    expect(result).toContain('Luis')
    expect(session.estadoActual).toBe(BotState.SELECT_BARBER)
    expect(session.datosTemporales.barberListMapping).toHaveLength(2)
  })

  it('input "2" shows service list and transitions to SELECT_PROCEDURE', async () => {
    mockGetServicesMenuText.mockResolvedValue(mockProcedures)
    const session = makeSession()
    const result = await StateHandlers[BotState.INICIO](session, '2')
    expect(result).toContain('Corte')
    expect(session.estadoActual).toBe(BotState.SELECT_PROCEDURE)
    expect(session.datosTemporales.proceduresList).toHaveLength(1)
  })

  it('input "2" with empty services returns error and stays at INICIO', async () => {
    mockGetServicesMenuText.mockResolvedValue([])
    const session = makeSession()
    const result = await StateHandlers[BotState.INICIO](session, '2')
    expect(result).toContain('No hay servicios')
    expect(session.estadoActual).toBe(BotState.INICIO)
  })

  it('input "3" lists active citas and transitions to LIST_CITAS', async () => {
    mockListForCliente.mockResolvedValue([mockCitaRaw])
    const session = makeSession()
    const result = await StateHandlers[BotState.INICIO](session, '3')
    expect(result).toContain('Tus citas activas')
    expect(result).toContain('Corte')
    expect(session.estadoActual).toBe(BotState.LIST_CITAS)
    expect(session.datosTemporales.citasActivas).toHaveLength(1)
    expect(mockListForCliente).toHaveBeenCalledWith('3001234567')
  })

  it('input "3" with no citas returns message and stays at INICIO', async () => {
    mockListForCliente.mockResolvedValue([])
    const session = makeSession()
    const result = await StateHandlers[BotState.INICIO](session, '3')
    expect(result).toContain('No tienes citas activas')
    expect(session.estadoActual).toBe(BotState.INICIO)
  })
})

// ─── SELECT_BARBER ────────────────────────────────────────────────────────────

describe('handlerSelectBarber', () => {
  const barberList = mockBarbers.map((b, idx) => ({ ...b, idx: idx + 1 }))

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetProcedures.mockResolvedValue([
      { id: 's1', nombre: 'Corte', precio: 25000, duracion: 30, idBarbero: 'b1' },
    ])
  })

  it('valid number shows procedures and transitions to SELECT_PROCEDURE', async () => {
    const session = makeSession({
      estadoActual: BotState.SELECT_BARBER,
      datosTemporales: { barberListMapping: barberList },
    })
    const result = await StateHandlers[BotState.SELECT_BARBER](session, '1')
    expect(result).toContain('Juan')
    expect(result).toContain('Corte')
    expect(session.estadoActual).toBe(BotState.SELECT_PROCEDURE)
    expect(session.datosTemporales.proceduresList).toHaveLength(1)
  })

  it('invalid number returns error message', async () => {
    const session = makeSession({
      estadoActual: BotState.SELECT_BARBER,
      datosTemporales: { barberListMapping: barberList },
    })
    const result = await StateHandlers[BotState.SELECT_BARBER](session, '99')
    expect(result).toContain('No encontré ese barbero')
    expect(session.estadoActual).toBe(BotState.SELECT_BARBER)
  })
})

// ─── SELECT_PROCEDURE ─────────────────────────────────────────────────────────

describe('handlerSelectProcedure', () => {
  const procedures = mockProcedures.map((p, idx) => ({ ...p, idx: idx + 1 }))

  beforeEach(() => {
    jest.clearAllMocks()
    // generateAvailableDates will call getAvailableSlots for multiple days
    mockGetAvailableSlots.mockResolvedValue(availableSlots)
  })

  it('valid procedure shows available dates and transitions to SELECT_DATE', async () => {
    const session = makeSession({
      estadoActual: BotState.SELECT_PROCEDURE,
      datosTemporales: { proceduresList: procedures },
    })
    const result = await StateHandlers[BotState.SELECT_PROCEDURE](session, '1')
    expect(result).toContain('Corte')
    expect(result).toContain('fechas disponibles')
    expect(session.estadoActual).toBe(BotState.SELECT_DATE)
    expect(session.datosTemporales.procedureDates!.length).toBeGreaterThan(0)
    expect(mockGetAvailableSlots).toHaveBeenCalledWith('b1', expect.any(String), 30)
  })

  it('invalid number returns error message', async () => {
    const session = makeSession({
      estadoActual: BotState.SELECT_PROCEDURE,
      datosTemporales: { proceduresList: procedures },
    })
    const result = await StateHandlers[BotState.SELECT_PROCEDURE](session, '99')
    expect(result).toContain('No encontré ese servicio')
  })

  it('no available dates shows unavailable message', async () => {
    mockGetAvailableSlots.mockResolvedValue([{ time: '09:00', available: false }])
    const session = makeSession({
      estadoActual: BotState.SELECT_PROCEDURE,
      datosTemporales: { proceduresList: procedures },
    })
    const result = await StateHandlers[BotState.SELECT_PROCEDURE](session, '1')
    expect(result).toContain('No hay fechas disponibles')
  })
})

// ─── SELECT_DATE ──────────────────────────────────────────────────────────────

describe('handleSelectDate', () => {
  const dates = [
    { idx: 1, fecha: '2026-06-20' },
    { idx: 2, fecha: '2026-06-21' },
  ]
  const procedure = { id: 's1', nombre: 'Corte', precio: 25000, duracion: 30, idBarbero: 'b1' }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAvailableSlots.mockResolvedValue(availableSlots)
  })

  it('valid date shows time slots and transitions to SELECT_TIME_SLOT', async () => {
    const session = makeSession({
      estadoActual: BotState.SELECT_DATE,
      datosTemporales: { procedureDates: dates, procedure },
    })
    const result = await StateHandlers[BotState.SELECT_DATE](session, '1')
    expect(result).toContain('09:00')
    expect(result).toContain('10:00')
    expect(session.estadoActual).toBe(BotState.SELECT_TIME_SLOT)
    expect(session.datosTemporales.timeSlotsList).toHaveLength(2)
    expect(mockGetAvailableSlots).toHaveBeenCalledWith('b1', '2026-06-20', 30)
  })

  it('invalid date number returns error', async () => {
    const session = makeSession({
      estadoActual: BotState.SELECT_DATE,
      datosTemporales: { procedureDates: dates, procedure },
    })
    const result = await StateHandlers[BotState.SELECT_DATE](session, '99')
    expect(result).toContain('no es válida')
  })

  it('no available slots returns unavailable message', async () => {
    mockGetAvailableSlots.mockResolvedValue([{ time: '09:00', available: false }])
    const session = makeSession({
      estadoActual: BotState.SELECT_DATE,
      datosTemporales: { procedureDates: dates, procedure },
    })
    const result = await StateHandlers[BotState.SELECT_DATE](session, '1')
    expect(result).toContain('No hay horarios disponibles')
  })
})

// ─── SELECT_TIME_SLOT ─────────────────────────────────────────────────────────

describe('handleSelectTimeSlot', () => {
  const timeSlots = [
    { idx: 1, time: '09:00', horaFin: '09:30:00' },
    { idx: 2, time: '10:00', horaFin: '10:30:00' },
  ]
  const procedure = { id: 's1', nombre: 'Corte', precio: 25000, duracion: 30 }
  const selectedDate = { idx: 1, fecha: '2026-06-20' }

  it('valid slot shows summary with time and horaFin and transitions to DATA_CONFIRMATION', async () => {
    const session = makeSession({
      estadoActual: BotState.SELECT_TIME_SLOT,
      datosTemporales: { timeSlotsList: timeSlots, procedure, selectedDate },
    })
    const result = await StateHandlers[BotState.SELECT_TIME_SLOT](session, '1')
    expect(result).toContain('09:00')
    expect(result).toContain('09:30')
    expect(result).toContain('Confirmar')
    expect(session.estadoActual).toBe(BotState.DATA_CONFIRMATION)
    expect(session.datosTemporales.selectedTimeSlot?.time).toBe('09:00')
    expect(session.datosTemporales.selectedTimeSlot?.horaFin).toBe('09:30:00')
  })

  it('invalid slot number returns error', async () => {
    const session = makeSession({
      estadoActual: BotState.SELECT_TIME_SLOT,
      datosTemporales: { timeSlotsList: timeSlots, procedure, selectedDate },
    })
    const result = await StateHandlers[BotState.SELECT_TIME_SLOT](session, '99')
    expect(result).toContain('no es válida')
  })
})

// ─── DATA_CONFIRMATION ────────────────────────────────────────────────────────

describe('handleDataConfirmation', () => {
  const procedure = { id: 's1', nombre: 'Corte', precio: 25000, duracion: 30, idBarbero: 'b1' }
  const selectedTimeSlot = { idx: 1, time: '09:00', horaFin: '09:30:00' }
  const selectedDate = { idx: 1, fecha: '2026-06-20' }
  const procedureDates = [
    { idx: 1, fecha: '2026-06-20' },
    { idx: 2, fecha: '2026-06-21' },
  ]

  beforeEach(() => jest.clearAllMocks())

  it('input "1" creates booking via BookingService and returns payment link message', async () => {
    mockBookingCreate.mockResolvedValue({
      booking: { id: 'appt-1' },
      payment: { monto: 12500 },
    })
    mockCreatePaymentLink.mockResolvedValue('https://checkout.wompi.co/l/abc')

    const session = makeSession({
      estadoActual: BotState.DATA_CONFIRMATION,
      datosTemporales: { procedure, selectedTimeSlot, selectedDate, user: mockUser },
    })
    const result = await StateHandlers[BotState.DATA_CONFIRMATION](session, '1')

    expect(result).toContain('¡Cita agendada!')
    expect(result).toContain('https://checkout.wompi.co/l/abc')
    expect(mockBookingCreate).toHaveBeenCalledWith({
      idServicio: 's1',
      fecha: '2026-06-20',
      hora: '09:00',
      cliente: {
        nombres: 'Pedro',
        apellidos: 'García',
        celular: '3001234567',
        email: 'pedro@test.com',
      },
    })
    expect(mockCreatePaymentLink).toHaveBeenCalledWith({ id: 'appt-1', precio: 12500 })
    expect(session.estadoActual).toBe(BotState.INICIO)
  })

  it('input "1" with race condition (409) returns slot-taken message', async () => {
    const err: any = new Error('Horario no disponible')
    err.statusCode = 409
    mockBookingCreate.mockRejectedValue(err)

    const session = makeSession({
      estadoActual: BotState.DATA_CONFIRMATION,
      datosTemporales: { procedure, selectedTimeSlot, selectedDate, user: mockUser },
    })
    const result = await StateHandlers[BotState.DATA_CONFIRMATION](session, '1')
    expect(result).toContain('horario acaba de ser tomado')
    expect(session.estadoActual).toBe(BotState.SELECT_TIME_SLOT)
  })

  it('input "2" returns to date selection', async () => {
    const session = makeSession({
      estadoActual: BotState.DATA_CONFIRMATION,
      datosTemporales: { procedure, selectedTimeSlot, selectedDate, user: mockUser, procedureDates },
    })
    const result = await StateHandlers[BotState.DATA_CONFIRMATION](session, '2')
    expect(result).toContain('elige otra fecha')
    expect(session.estadoActual).toBe(BotState.SELECT_DATE)
  })

  it('input "2" with no dates transitions to INICIO', async () => {
    const session = makeSession({
      estadoActual: BotState.DATA_CONFIRMATION,
      datosTemporales: { procedure, selectedTimeSlot, selectedDate, user: mockUser, procedureDates: [] },
    })
    const result = await StateHandlers[BotState.DATA_CONFIRMATION](session, '2')
    expect(result).toContain('No hay fechas')
    expect(session.estadoActual).toBe(BotState.INICIO)
  })

  it('unknown input returns validation message', async () => {
    const session = makeSession({
      estadoActual: BotState.DATA_CONFIRMATION,
      datosTemporales: { procedure, selectedTimeSlot, selectedDate, user: mockUser },
    })
    const result = await StateHandlers[BotState.DATA_CONFIRMATION](session, 'x')
    expect(result).toContain('Opción no válida')
  })
})

// ─── CU-05: LIST_CITAS ────────────────────────────────────────────────────────

describe('handleListCitas (CU-05)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('valid number selects cita and transitions to CANCEL_CONFIRM', async () => {
    const session = makeSession({
      estadoActual: BotState.LIST_CITAS,
      datosTemporales: { citasActivas: [indexedCita] },
    })
    const result = await StateHandlers[BotState.LIST_CITAS](session, '1')
    expect(result).toContain('Cita seleccionada')
    expect(result).toContain('Corte')
    expect(result).toContain('Cancelar')
    expect(result).toContain('Reprogramar')
    expect(session.estadoActual).toBe(BotState.CANCEL_CONFIRM)
    expect(session.datosTemporales.selectedCita?.id).toBe('cita-1')
  })

  it('invalid number returns error message', async () => {
    const session = makeSession({
      estadoActual: BotState.LIST_CITAS,
      datosTemporales: { citasActivas: [indexedCita] },
    })
    const result = await StateHandlers[BotState.LIST_CITAS](session, '99')
    expect(result).toContain('Número inválido')
  })

  it('missing citasActivas transitions to INICIO', async () => {
    const session = makeSession({
      estadoActual: BotState.LIST_CITAS,
      datosTemporales: {},
    })
    const result = await StateHandlers[BotState.LIST_CITAS](session, '1')
    expect(session.estadoActual).toBe(BotState.INICIO)
    expect(result).toContain('menú')
  })
})

// ─── CU-05: CANCEL_CONFIRM ────────────────────────────────────────────────────

describe('handleCancelConfirm (CU-05)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBarberoFindByPk.mockResolvedValue({ plazoCancelacion: null, plazoReprogramacion: null })
  })

  it('input "1" with future cita (+48h) cancels successfully', async () => {
    mockUpdateStatus.mockResolvedValue({})
    const session = makeSession({
      estadoActual: BotState.CANCEL_CONFIRM,
      datosTemporales: { selectedCita: indexedCita },
    })
    const result = await StateHandlers[BotState.CANCEL_CONFIRM](session, '1')
    expect(result).toContain('cancelada exitosamente')
    expect(mockUpdateStatus).toHaveBeenCalledWith('cita-1', 'b1', 'cancelada')
    expect(session.estadoActual).toBe(BotState.INICIO)
  })

  it('input "1" with cita within 24h blocks cancellation', async () => {
    const nearFutureCita = {
      ...indexedCita,
      horario: {
        ...indexedCita.horario,
        fecha: new Date(Date.now() + 3_600_000).toISOString().split('T')[0],
        horaInicio: '00:00:00',
      },
    }
    const session = makeSession({
      estadoActual: BotState.CANCEL_CONFIRM,
      datosTemporales: { selectedCita: nearFutureCita },
    })
    const result = await StateHandlers[BotState.CANCEL_CONFIRM](session, '1')
    expect(result).toContain('menos de 24 horas')
    expect(mockUpdateStatus).not.toHaveBeenCalled()
    expect(session.estadoActual).toBe(BotState.INICIO)
  })

  it('input "2" shows reschedule dates and transitions to RESCHEDULE_DATE', async () => {
    mockGetAvailableSlots.mockResolvedValue(availableSlots)
    const session = makeSession({
      estadoActual: BotState.CANCEL_CONFIRM,
      datosTemporales: { selectedCita: indexedCita },
    })
    const result = await StateHandlers[BotState.CANCEL_CONFIRM](session, '2')
    expect(result).toContain('Reprogramar')
    expect(result).toContain('fechas disponibles')
    expect(session.estadoActual).toBe(BotState.RESCHEDULE_DATE)
  })

  it('unknown input returns validation message', async () => {
    const session = makeSession({
      estadoActual: BotState.CANCEL_CONFIRM,
      datosTemporales: { selectedCita: indexedCita },
    })
    const result = await StateHandlers[BotState.CANCEL_CONFIRM](session, 'x')
    expect(result).toContain('Opción no válida')
  })
})

// ─── CU-05: RESCHEDULE_DATE ───────────────────────────────────────────────────

describe('handleRescheduleDate (CU-05)', () => {
  const dates = [
    { idx: 1, fecha: '2026-06-20' },
    { idx: 2, fecha: '2026-06-21' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAvailableSlots.mockResolvedValue(availableSlots)
  })

  it('valid date shows time slots and transitions to RESCHEDULE_TIME', async () => {
    const session = makeSession({
      estadoActual: BotState.RESCHEDULE_DATE,
      datosTemporales: { selectedCita: indexedCita, procedureDates: dates },
    })
    const result = await StateHandlers[BotState.RESCHEDULE_DATE](session, '1')
    expect(result).toContain('09:00')
    expect(result).toContain('10:00')
    expect(session.estadoActual).toBe(BotState.RESCHEDULE_TIME)
    expect(session.datosTemporales.timeSlotsList!.length).toBeGreaterThan(0)
    expect(mockGetAvailableSlots).toHaveBeenCalledWith('b1', '2026-06-20', 30)
  })

  it('invalid date number returns error', async () => {
    const session = makeSession({
      estadoActual: BotState.RESCHEDULE_DATE,
      datosTemporales: { selectedCita: indexedCita, procedureDates: dates },
    })
    const result = await StateHandlers[BotState.RESCHEDULE_DATE](session, '99')
    expect(result).toContain('Fecha inválida')
  })

  it('no available slots shows message and stays in RESCHEDULE_DATE', async () => {
    mockGetAvailableSlots.mockResolvedValue([{ time: '09:00', available: false }])
    const session = makeSession({
      estadoActual: BotState.RESCHEDULE_DATE,
      datosTemporales: { selectedCita: indexedCita, procedureDates: dates },
    })
    const result = await StateHandlers[BotState.RESCHEDULE_DATE](session, '1')
    expect(result).toContain('No hay horarios disponibles')
  })
})

// ─── CU-05: RESCHEDULE_TIME ───────────────────────────────────────────────────

describe('handleRescheduleTime (CU-05)', () => {
  const timeSlots = [
    { idx: 1, time: '09:00', horaFin: '09:30:00' },
    { idx: 2, time: '10:00', horaFin: '10:30:00' },
  ]
  const selectedDate = { idx: 1, fecha: '2026-06-20' }

  beforeEach(() => jest.clearAllMocks())

  it('valid slot reschedules booking and transitions to INICIO', async () => {
    mockReschedule.mockResolvedValue({})
    const session = makeSession({
      estadoActual: BotState.RESCHEDULE_TIME,
      datosTemporales: { selectedCita: indexedCita, selectedDate, timeSlotsList: timeSlots },
    })
    const result = await StateHandlers[BotState.RESCHEDULE_TIME](session, '1')
    expect(result).toContain('¡Cita reprogramada!')
    expect(result).toContain('09:00')
    expect(mockReschedule).toHaveBeenCalledWith('cita-1', '2026-06-20', '09:00')
    expect(session.estadoActual).toBe(BotState.INICIO)
  })

  it('invalid slot number returns error', async () => {
    const session = makeSession({
      estadoActual: BotState.RESCHEDULE_TIME,
      datosTemporales: { selectedCita: indexedCita, selectedDate, timeSlotsList: timeSlots },
    })
    const result = await StateHandlers[BotState.RESCHEDULE_TIME](session, '99')
    expect(result).toContain('Horario inválido')
  })

  it('race condition (409) returns to date selection', async () => {
    const err: any = new Error('No disponible')
    err.statusCode = 409
    mockReschedule.mockRejectedValue(err)
    const session = makeSession({
      estadoActual: BotState.RESCHEDULE_TIME,
      datosTemporales: {
        selectedCita: indexedCita,
        selectedDate,
        timeSlotsList: timeSlots,
        procedureDates: [{ idx: 1, fecha: '2026-06-20' }],
      },
    })
    const result = await StateHandlers[BotState.RESCHEDULE_TIME](session, '1')
    expect(result).toContain('ya fue tomado')
    expect(session.estadoActual).toBe(BotState.RESCHEDULE_DATE)
  })
})
