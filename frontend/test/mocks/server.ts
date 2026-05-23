/**
 * Servidor MSW para entorno Node.js (Vitest).
 * Intercepta fetch a nivel de Node y devuelve las respuestas de los handlers.
 */
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
