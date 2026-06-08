import request from 'supertest'
import { createApp } from '../src/app'
import { hashPassword, verifyPassword } from '../src/services/auth.service'

const app = createApp()

describe('App', () => {
  describe('GET /health', () => {
    it('should expose service health without a database query', async () => {
      const res = await request(app).get('/health')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ status: 'ok', service: 'miturno-api' })
    })
  })

  describe('Authentication middleware', () => {
    it('should reject requests to private API resources without auth token', async () => {
      const res = await request(app).get('/api/servicios')
      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('Password hashing', () => {
    it('should salt passwords so two hashes of the same input differ', () => {
      const first = hashPassword('Demo1234')
      const second = hashPassword('Demo1234')
      expect(first).not.toBe(second)
    })

    it('should verify a correct password against its hash', () => {
      const hash = hashPassword('Demo1234')
      expect(verifyPassword('Demo1234', hash)).toBe(true)
    })

    it('should reject an incorrect password', () => {
      const hash = hashPassword('Demo1234')
      expect(verifyPassword('incorrecta', hash)).toBe(false)
    })
  })
})
