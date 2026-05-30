import request from 'supertest'
import { createApp } from '../../src/app'

describe('API Integration Tests', () => {
  const app = createApp()

  describe('Health Check', () => {
    it('GET /health should return ok status', async () => {
      const response = await request(app).get('/health')
      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        status: 'ok',
        service: 'miturno-api',
      })
    })
  })

  describe('Root Endpoint', () => {
    it('GET / should return success message', async () => {
      const response = await request(app).get('/')
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'success')
      expect(response.body).toHaveProperty('message')
    })
  })

  describe('404 Handling', () => {
    it('should return 404 for non-existent route', async () => {
      const response = await request(app).get('/api/non-existent')
      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('CORS Headers', () => {
    it('should include security headers in response', async () => {
      const response = await request(app).get('/')
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-frame-options']).toBe('DENY')
      expect(response.headers['referrer-policy']).toBe('no-referrer')
    })
  })

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await request(app).get('/')
      expect(response.headers['ratelimit-limit']).toBeDefined()
      expect(response.headers['ratelimit-remaining']).toBeDefined()
    })
  })

  describe('Correlation ID', () => {
    it('should include correlation id in response', async () => {
      const response = await request(app).get('/')
      expect(response.headers['x-correlation-id']).toBeDefined()
    })

    it('should use provided correlation id', async () => {
      const customId = 'test-correlation-id-123'
      const response = await request(app)
        .get('/')
        .set('x-correlation-id', customId)
      expect(response.headers['x-correlation-id']).toBe(customId)
    })
  })

  describe('Content Type', () => {
    it('should return JSON responses', async () => {
      const response = await request(app).get('/')
      expect(response.type).toMatch(/json/)
    })
  })
})
