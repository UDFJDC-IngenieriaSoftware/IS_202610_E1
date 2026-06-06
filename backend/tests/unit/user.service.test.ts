import { UserService } from '../../src/services/user.service'

jest.mock('../../src/models', () => ({
  Cliente: { findOne: jest.fn() },
}))

import { Cliente } from '../../src/models'

describe('UserService', () => {
  let service: UserService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new UserService()
  })

  describe('getUserByPhone', () => {
    const mockUser = {
      id: 'u1', nombres: 'Juan', apellidos: 'García', celular: '3001234567',
    }

    it('returns user when found', async () => {
      ;(Cliente.findOne as jest.Mock).mockResolvedValue(mockUser)
      const result = await service.getUserByPhone('3001234567')
      expect(result).toEqual(mockUser)
      expect(Cliente.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { celular: '3001234567' } }),
      )
    })

    it('throws when user not found', async () => {
      ;(Cliente.findOne as jest.Mock).mockResolvedValue(null)
      await expect(service.getUserByPhone('0000000000')).rejects.toThrow('User not found')
    })

    it('queries with raw:true', async () => {
      ;(Cliente.findOne as jest.Mock).mockResolvedValue(mockUser)
      await service.getUserByPhone('3001234567')
      expect(Cliente.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ raw: true }),
      )
    })
  })
})
