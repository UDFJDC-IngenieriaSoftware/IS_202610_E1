import logger from '../../src/utils/logger'

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('logging levels', () => {
    it('should have all logging methods', () => {
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
    })

    it('should log debug messages', () => {
      const message = 'Debug message'
      expect(() => logger.debug(message)).not.toThrow()
    })

    it('should log info messages', () => {
      const message = 'Info message'
      expect(() => logger.info(message)).not.toThrow()
    })

    it('should log warn messages', () => {
      const message = 'Warning message'
      expect(() => logger.warn(message)).not.toThrow()
    })

    it('should log error messages', () => {
      const message = 'Error message'
      expect(() => logger.error(message)).not.toThrow()
    })

    it('should log with metadata', () => {
      const message = 'Message with metadata'
      const metadata = { userId: 1, action: 'create' }
      expect(() => logger.info(message, metadata)).not.toThrow()
    })
  })

  describe('logger configuration', () => {
    it('should include service name in logs', () => {
      expect(logger.defaultMeta).toHaveProperty('service', 'miturno-api')
    })

    it('should have transports configured', () => {
      expect(logger.transports).toBeDefined()
      expect(logger.transports.length).toBeGreaterThan(0)
    })
  })
})
