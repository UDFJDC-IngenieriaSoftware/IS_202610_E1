import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, serviceSchema, bookingSchema } from '../../src/utils/validation'

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      }
      expect(() => loginSchema.parse(data)).not.toThrow()
    })

    it('should reject invalid email', () => {
      expect(() =>
        loginSchema.parse({
          email: 'invalid-email',
          password: 'password123',
        })
      ).toThrow()
    })

    it('should reject short password', () => {
      expect(() =>
        loginSchema.parse({
          email: 'test@example.com',
          password: 'short',
        })
      ).toThrow()
    })
  })

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        name: 'John Doe',
      }
      expect(() => registerSchema.parse(data)).not.toThrow()
    })

    it('should reject mismatched passwords', () => {
      expect(() =>
        registerSchema.parse({
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password456',
          name: 'John Doe',
        })
      ).toThrow()
    })

    it('should reject short name', () => {
      expect(() =>
        registerSchema.parse({
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          name: 'J',
        })
      ).toThrow()
    })
  })

  describe('serviceSchema', () => {
    it('should validate correct service data', () => {
      const data = {
        name: 'Corte de cabello',
        description: 'Corte clásico con máquina',
        duration: 30,
        price: 25000,
      }
      expect(() => serviceSchema.parse(data)).not.toThrow()
    })

    it('should reject negative price', () => {
      expect(() =>
        serviceSchema.parse({
          name: 'Corte de cabello',
          duration: 30,
          price: -5000,
        })
      ).toThrow()
    })

    it('should reject zero/negative duration', () => {
      expect(() =>
        serviceSchema.parse({
          name: 'Corte de cabello',
          duration: 0,
          price: 25000,
        })
      ).toThrow()
    })
  })

  describe('bookingSchema', () => {
    it('should validate correct booking data', () => {
      const data = {
        barberId: 1,
        serviceId: 1,
        date: '2026-06-15',
        time: '14:30',
        customerPhone: '+573001234567',
      }
      expect(() => bookingSchema.parse(data)).not.toThrow()
    })

    it('should reject invalid date format', () => {
      expect(() =>
        bookingSchema.parse({
          barberId: 1,
          serviceId: 1,
          date: '15-06-2026',
          time: '14:30',
          customerPhone: '+573001234567',
        })
      ).toThrow()
    })

    it('should reject invalid time format', () => {
      expect(() =>
        bookingSchema.parse({
          barberId: 1,
          serviceId: 1,
          date: '2026-06-15',
          time: '2:30 PM',
          customerPhone: '+573001234567',
        })
      ).toThrow()
    })

    it('should reject invalid phone', () => {
      expect(() =>
        bookingSchema.parse({
          barberId: 1,
          serviceId: 1,
          date: '2026-06-15',
          time: '14:30',
          customerPhone: '123',
        })
      ).toThrow()
    })
  })
})
