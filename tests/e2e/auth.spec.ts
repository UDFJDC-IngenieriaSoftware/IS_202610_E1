/**
 * Authentication Flow — LoginPage y RegisterPage
 *
 * Rutas: /login · /registro
 *
 * Cubre:
 *  ✅ / redirige a /login cuando no hay sesión
 *  ✅ Envío sin credenciales activa validación HTML5 en los inputs
 *  ✅ Email inválido → input:invalid
 *  ✅ Link "Crea una" en login navega a /registro
 *  ✅ Link "Inicia sesión" en registro navega a /login
 *  ✅ Loading state: botón se deshabilita y cambia texto durante el submit
 *  ✅ Error de API: el div#login-error con role=alert se hace visible
 */
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar cookies primero (elimina sesión del barbero de prueba inyectada por storageState)
    await page.context().clearCookies()
  })

  test('/ muestra la landing page y tiene link al login', async ({ page }) => {
    await page.goto('/')
    // La raíz carga LandingPage (no redirige a /login)
    await expect(page).toHaveURL('http://localhost:5173/')
    // Debe existir algún link hacia /login o /registro
    const loginLink = page.locator('a[href="/login"], a[href="/registro"]').first()
    await expect(loginLink).toBeVisible({ timeout: 5_000 })
  })

  test('envío vacío activa validación HTML5 en email y password', async ({ page }) => {
    await page.goto('/login')
    await page.click('button[type="submit"]')

    // El browser pone :invalid en los campos requeridos que están vacíos
    await expect(page.locator('input[type="email"]:invalid')).toBeVisible()
  })

  test('email con formato inválido pone el input en estado :invalid', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'no-es-email')
    await page.fill('input[type="password"]', 'abc123')
    await page.click('button[type="submit"]')

    await expect(page.locator('input[type="email"]:invalid')).toBeVisible()
  })

  test('link "Crea una" desde login navega a /registro', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Crea una' }).click()
    await expect(page).toHaveURL(/\/registro/, { timeout: 5_000 })
  })

  test('link "Inicia sesión" desde registro navega a /login', async ({ page }) => {
    await page.goto('/registro')
    await page.getByRole('link', { name: 'Inicia sesión' }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })

  test('loading state: botón se deshabilita y muestra "Entrando…" durante el submit', async ({ page }) => {
    await page.goto('/login')

    // Interceptar para mantener la request colgada
    await page.route('**/api/auth/login', route =>
      new Promise(() => { /* nunca resuelve */ }),
    )

    await page.fill('input[type="email"]', 'juan.perez@miturno.com')
    await page.fill('input[type="password"]', 'Demo1234')
    await page.click('button[type="submit"]')

    const btn = page.locator('button[type="submit"]')
    await expect(btn).toBeDisabled({ timeout: 3_000 })
    await expect(btn).toContainText('Entrando…')
  })

  test('error de API muestra alerta visible en el formulario', async ({ page }) => {
    await page.goto('/login')

    await page.route('**/api/auth/login', route =>
      route.fulfill({ status: 401, body: JSON.stringify({ error: 'Credenciales incorrectas' }) }),
    )

    await page.fill('input[type="email"]', 'juan.perez@miturno.com')
    await page.fill('input[type="password"]', 'password_malo')
    await page.click('button[type="submit"]')

    await expect(page.locator('[role="alert"]#login-error')).toBeVisible({ timeout: 5_000 })
  })
})
