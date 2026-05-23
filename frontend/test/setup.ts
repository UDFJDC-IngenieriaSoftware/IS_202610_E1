/**
 * Archivo de setup global de Vitest.
 * Se ejecuta antes de cada suite de tests.
 *
 * - Registra los matchers de @testing-library/jest-dom (toBeInTheDocument, etc.)
 * - Arranca el servidor MSW (intercept de fetch en Node.js)
 */
import '@testing-library/jest-dom'
import { server } from './mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
