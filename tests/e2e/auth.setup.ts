/**
 * auth.setup.ts — proyecto "setup" de Playwright.
 *
 * Corre una sola vez antes de cualquier test de UI.
 * Hace login real en la app, espera redirección al panel
 * y persiste el storageState (cookies) en playwright/.auth/barbero.json.
 * Los proyectos UI consumen ese archivo para arrancar ya autenticados.
 */
import { test as setup, expect } from '@playwright/test'
import { BARBERO_CREDENTIALS, AUTH_FILE } from './fixtures/auth.fixture'

setup('autenticar barbero de prueba', async ({ page }) => {
  await page.goto('/login')

  await page.fill('input[type="email"]', BARBERO_CREDENTIALS.email)
  await page.fill('input[type="password"]', BARBERO_CREDENTIALS.password)
  await page.click('button[type="submit"]')

  // Esperar redirección exitosa al panel del barbero
  await expect(page).toHaveURL(/\/panel/, { timeout: 15_000 })

  // Persistir cookies de sesión para reutilizar en todos los tests UI
  await page.context().storageState({ path: AUTH_FILE })
})
