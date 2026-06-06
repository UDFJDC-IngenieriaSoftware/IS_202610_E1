import { PaymentService } from '../../src/services/payment.service'
import { HttpError } from '../../src/utils/http'
import { createHash } from 'node:crypto'

jest.mock('../../src/models', () => ({
  Pago: { findByPk: jest.fn(), findOne: jest.fn() },
  Cita: { findByPk: jest.fn() },
  Cliente: { findByPk: jest.fn() },
  Horario: { update: jest.fn() },
  Servicio: {},
  Barbero: { findByPk: jest.fn() },
}))

jest.mock('axios')
jest.mock('../../src/config/env', () => ({
  env: {
    wompiPrivateKey: '',
    wompiEventsSecret: '',
    wompiApiUrl: 'https://sandbox.wompi.co/v1',
    paymentRedirectUrl: 'https://app.miturno.co/pago',
  },
}))
jest.mock('../../src/services/notification.service', () => ({
  notificationService: { sendBookingConfirmation: jest.fn() },
}))
jest.mock('../../src/whatsapp.factory', () => ({
  default: { sendText: jest.fn().mockResolvedValue({}) },
}))

import { Pago, Cita } from '../../src/models'
import { env } from '../../src/config/env'
import axios from 'axios'

const mockEnv = env as any

const PROPS = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents']

function buildValidEvent(secret: string, txOverrides: any = {}, eventOverrides: any = {}) {
  const timestamp = 1234567890
  const transaction = {
    id: 'txn-001',
    status: 'APPROVED',
    amount_in_cents: 1500000,
    reference: 'MITURNO-cita-1',
    payment_link_id: undefined,
    ...txOverrides,
  }
  const values = [String(transaction.id), String(transaction.status), String(transaction.amount_in_cents)].join('')
  const checksum = createHash('sha256')
    .update(`${values}${timestamp}${secret}`)
    .digest('hex')
    .toUpperCase()

  return {
    event: 'transaction.updated',
    data: { transaction },
    sent_at: new Date().toISOString(),
    timestamp,
    signature: { properties: PROPS, checksum },
    ...eventOverrides,
  }
}

describe('PaymentService', () => {
  let service: PaymentService

  beforeEach(() => {
    jest.clearAllMocks()
    mockEnv.wompiPrivateKey = ''
    mockEnv.wompiEventsSecret = ''
    service = new PaymentService()
  })

  describe('serialize', () => {
    it('returns a flat payment DTO', () => {
      const payment = {
        id: 'p1', idCita: 'c1', monto: 15000,
        estado: 'pendiente', referencia: 'REF-1',
        transactionId: null,
      } as any

      const result = service.serialize(payment, 'https://link')
      expect(result.id).toBe('p1')
      expect(result.bookingId).toBe('c1')
      expect(result.amount).toBe(15000)
      expect(result.paymentUrl).toBe('https://link')
    })

    it('sets paymentUrl to null when not provided', () => {
      const payment = {
        id: 'p1', idCita: 'c1', monto: 5000, estado: 'pendiente',
        referencia: 'R', transactionId: null,
      } as any
      const result = service.serialize(payment)
      expect(result.paymentUrl).toBeNull()
    })
  })

  describe('createPaymentLink', () => {
    it('returns null when wompiPrivateKey is not set', async () => {
      const payment = { id: 'p1', idCita: 'c1', monto: 15000 } as any
      const result = await service.createPaymentLink(payment)
      expect(result).toBeNull()
    })

    it('calls Wompi API and returns checkout URL', async () => {
      mockEnv.wompiPrivateKey = 'test-key'
      const payment = {
        id: 'p1', idCita: 'cita-1', monto: 15000,
        update: jest.fn().mockResolvedValue({}),
      } as any
      ;(axios.post as jest.Mock).mockResolvedValue({ data: { data: { id: 'link-abc' } } })

      const url = await service.createPaymentLink(payment)
      expect(url).toBe('https://checkout.wompi.co/l/link-abc')
      expect(payment.update).toHaveBeenCalledWith({ paymentLinkId: 'link-abc' })
    })

    it('throws 502 when Wompi API fails', async () => {
      mockEnv.wompiPrivateKey = 'test-key'
      const payment = { id: 'p1', idCita: 'cita-1', monto: 15000 } as any
      ;(axios.post as jest.Mock).mockRejectedValue(new Error('Network error'))
      await expect(service.createPaymentLink(payment)).rejects.toThrow(HttpError)
    })
  })

  describe('refundPayment', () => {
    it('throws 503 when wompiPrivateKey is not configured', async () => {
      await expect(service.refundPayment('p1')).rejects.toThrow(HttpError)
      const err = await service.refundPayment('p1').catch((e) => e)
      expect(err.status).toBe(503)
    })

    it('throws 404 when payment not found', async () => {
      mockEnv.wompiPrivateKey = 'key'
      ;(Pago.findByPk as jest.Mock).mockResolvedValue(null)
      const err = await service.refundPayment('nonexistent').catch((e) => e)
      expect(err.status).toBe(404)
    })

    it('throws 409 when payment is not exitoso', async () => {
      mockEnv.wompiPrivateKey = 'key'
      ;(Pago.findByPk as jest.Mock).mockResolvedValue({ id: 'p1', estado: 'pendiente' })
      const err = await service.refundPayment('p1').catch((e) => e)
      expect(err.status).toBe(409)
    })

    it('throws 409 when payment has no transactionId', async () => {
      mockEnv.wompiPrivateKey = 'key'
      ;(Pago.findByPk as jest.Mock).mockResolvedValue({ id: 'p1', estado: 'exitoso', transactionId: null })
      const err = await service.refundPayment('p1').catch((e) => e)
      expect(err.status).toBe(409)
    })

    it('throws 404 when cita not found', async () => {
      mockEnv.wompiPrivateKey = 'key'
      ;(Pago.findByPk as jest.Mock).mockResolvedValue({ id: 'p1', estado: 'exitoso', transactionId: 'txn-1', idCita: 'c1' })
      ;(Cita.findByPk as jest.Mock).mockResolvedValue(null)
      const err = await service.refundPayment('p1').catch((e) => e)
      expect(err.status).toBe(404)
    })
  })

  describe('verifyEvent', () => {
    it('throws 503 when wompiEventsSecret is not set', () => {
      const event = buildValidEvent('any-secret')
      expect(() => service.verifyEvent(event)).toThrow(HttpError)
    })

    it('accepts a valid event signature', () => {
      const secret = 'my-secret'
      mockEnv.wompiEventsSecret = secret
      const event = buildValidEvent(secret)
      expect(() => service.verifyEvent(event)).not.toThrow()
    })

    it('throws 401 for a tampered checksum', () => {
      const secret = 'my-secret'
      mockEnv.wompiEventsSecret = secret
      const event = buildValidEvent(secret)
      event.signature.checksum = 'INVALIDSIGNATURE000000000000000000000000000000000000000000000000'
      expect(() => service.verifyEvent(event)).toThrow(HttpError)
    })

    it('accepts a valid checksum passed as header', () => {
      const secret = 'my-secret'
      mockEnv.wompiEventsSecret = secret
      const event = buildValidEvent(secret)
      const headerChecksum = event.signature.checksum
      event.signature.checksum = 'WRONG0000000000000000000000000000000000000000000000000000000000'
      expect(() => service.verifyEvent(event, headerChecksum)).not.toThrow()
    })
  })

  describe('handleEvent', () => {
    const secret = 'evt-secret'

    beforeEach(() => {
      mockEnv.wompiEventsSecret = secret
    })

    it('returns early when event type is not transaction.updated', async () => {
      const event = buildValidEvent(secret, { event: 'other.event' })
      await expect(service.handleEvent(event)).resolves.toBeUndefined()
    })

    it('returns early when no transaction in data', async () => {
      const event = buildValidEvent(secret)
      jest.spyOn(service, 'verifyEvent').mockReturnValue()
      ;(event as any).data = {}
      await expect(service.handleEvent(event)).resolves.toBeUndefined()
    })

    it('returns early when payment not found for the transaction', async () => {
      const event = buildValidEvent(secret)
      ;(Pago.findOne as jest.Mock).mockResolvedValue(null)
      await expect(service.handleEvent(event)).resolves.toBeUndefined()
    })

    it('throws 409 when amount does not match', async () => {
      const event = buildValidEvent(secret)
      ;(Pago.findOne as jest.Mock).mockResolvedValue({ id: 'p1', monto: 99999, referencia: 'REF', paymentLinkId: null })
      await expect(service.handleEvent(event)).rejects.toThrow(HttpError)
    })

    it('updates payment status to exitoso on APPROVED', async () => {
      const event = buildValidEvent(secret)
      const mockPagoInstance = {
        id: 'p1', monto: 15000, referencia: 'MITURNO-cita-1', paymentLinkId: null,
        idCita: 'cita-1',
        update: jest.fn().mockResolvedValue({}),
      }
      ;(Pago.findOne as jest.Mock).mockResolvedValue(mockPagoInstance)
      ;(Cita.findByPk as jest.Mock).mockResolvedValue(null) // no cita, skip notification

      await service.handleEvent(event)
      expect(mockPagoInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'exitoso' }),
      )
    })

    it('updates payment status to fallido on DECLINED', async () => {
      const declined = buildValidEvent(secret, { status: 'DECLINED' })
      const mockPagoInstance = {
        id: 'p1', monto: 15000, referencia: 'MITURNO-cita-1', paymentLinkId: null, idCita: 'cita-1',
        update: jest.fn().mockResolvedValue({}),
      }
      ;(Pago.findOne as jest.Mock).mockResolvedValue(mockPagoInstance)
      ;(Cita.findByPk as jest.Mock).mockResolvedValue(null)

      await service.handleEvent(declined)
      expect(mockPagoInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'fallido' }),
      )
    })
  })
})
