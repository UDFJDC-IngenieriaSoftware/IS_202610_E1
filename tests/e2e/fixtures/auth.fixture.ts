import { test as base, expect } from '@playwright/test'

/** Ruta donde se persiste el storageState del barbero autenticado */
export const AUTH_FILE = 'playwright/.auth/barbero.json'

/** Credenciales del barbero de prueba (seeder 20260525000000-demo-api-core) */
export const BARBERO_CREDENTIALS = {
  email: 'juan.perez@miturno.com',
  password: 'Demo1234',
  id: 'b0e86958-8686-4e38-967a-0e7845ef2001',
  nombre: 'Juan Pérez',
  barberia: 'MiTurno Centro',
} as const

/** Base URL del backend — puede sobreescribirse con PLAYWRIGHT_API_BASE_URL */
export const API_BASE =
  process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3000'

/**
 * test extendido para tests de UI del panel.
 * El storageState (cookie de sesión) ya viene inyectado por playwright.config
 * a través del proyecto 'chromium' que depende del proyecto 'setup'.
 * No se necesita lógica extra aquí; el export existe para unificar imports.
 */
export const test = base
export { expect }
