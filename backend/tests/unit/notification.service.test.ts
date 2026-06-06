import { NotificationService } from '../../src/services/notification.service'
import whatsappService from '../../src/whatsapp.factory'

jest.mock('../../src/whatsapp.factory')

describe('NotificationService', () => {
  let service: NotificationService
  const mockSendText = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(whatsappService.sendText as jest.Mock) = mockSendText
    service = new NotificationService()
  })

  const mockContext = {
    customerName: 'Juan García',
    customerPhone: '+573001234567',
    barberName: 'Carlos López',
    serviceName: 'Corte de cabello',
    dateTime: '2026-06-15 14:30',
    bookingId: 'uuid-123' as any,
  }

  describe('sendBookingConfirmation', () => {
    it('should send confirmation message', async () => {
      mockSendText.mockResolvedValue({ success: true })

      await service.sendBookingConfirmation(mockContext)

      expect(mockSendText).toHaveBeenCalled()
      const callArgs = mockSendText.mock.calls[0]
      expect(callArgs[0]).toBe(mockContext.customerPhone)
      expect(callArgs[1]).toContain('confirmada')
      expect(callArgs[1]).toContain(mockContext.barberName)
    })

    it('should log error if send fails', async () => {
      const error = new Error('WhatsApp send failed')
      mockSendText.mockRejectedValue(error)

      await expect(service.sendBookingConfirmation(mockContext)).rejects.toThrow()
    })
  })

  describe('sendReminder24h', () => {
    it('should send 24h reminder message', async () => {
      mockSendText.mockResolvedValue({ success: true })

      await service.sendReminder24h(mockContext)

      expect(mockSendText).toHaveBeenCalled()
      const callArgs = mockSendText.mock.calls[0]
      expect(callArgs[1]).toContain('mañana')
      expect(callArgs[1]).toContain(mockContext.barberName)
    })
  })

  describe('sendReminder2h', () => {
    it('should send 2h reminder message', async () => {
      mockSendText.mockResolvedValue({ success: true })

      await service.sendReminder2h(mockContext)

      expect(mockSendText).toHaveBeenCalled()
      const callArgs = mockSendText.mock.calls[0]
      expect(callArgs[1]).toContain('2 horas')
    })
  })

  describe('sendCancellation', () => {
    it('should send cancellation message', async () => {
      mockSendText.mockResolvedValue({ success: true })

      await service.sendCancellation(mockContext)

      expect(mockSendText).toHaveBeenCalled()
      const callArgs = mockSendText.mock.calls[0]
      expect(callArgs[1]).toContain('cancelada')
    })
  })
})
