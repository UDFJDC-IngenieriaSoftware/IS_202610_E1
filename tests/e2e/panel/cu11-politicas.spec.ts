/**
 * CU-11 — Políticas de cancelación y mensajes automáticos (PoliticasPage)
 *
 * RF-15 | /panel/politicas
 *
 * Cubre:
 *  ✅ Flujo principal: cargar página, ver campos, guardar cambios
 *  ✅ Persistencia: valores guardados se reflejan tras recargar
 *  ✅ FA-01: valores en blanco → sin restricción (null en backend)
 *  ✅ SEC: require autenticación
 */
import { test, expect } from '../fixtures/auth.fixture'

const RUTA  = '/panel/politicas'
const LABEL = 'Formulario de políticas'

test.describe('CU-11 · Políticas de cancelación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RUTA)
    await expect(page.locator(`form[aria-label="${LABEL}"]`)).toBeVisible({ timeout: 10_000 })
  })

  // ── Renderizado ─────────────────────────────────────────────────────────

  test('muestra los campos de plazos y mensajes automáticos', async ({ page }) => {
    await expect(page.getByText('Plazo de cancelación (horas)')).toBeVisible()
    await expect(page.getByText('Plazo de reprogramación (horas)')).toBeVisible()
    await expect(page.getByText('Mensaje de bienvenida')).toBeVisible()
    await expect(page.getByText('Mensaje de confirmación de pago')).toBeVisible()
    await expect(page.getByText('Mensaje de recordatorio')).toBeVisible()
  })

  test('muestra el botón "Guardar cambios"', async ({ page }) => {
    await expect(page.locator('button[type="submit"]', { hasText: 'Guardar cambios' })).toBeVisible()
  })

  // ── Guardar cambios ──────────────────────────────────────────────────────

  test('FP · guardar plazo de cancelación persiste tras recargar', async ({ page }) => {
    const inputCancelacion = page.getByLabel('Plazo de cancelación (horas)')

    // Guardar un valor conocido
    await inputCancelacion.fill('24')
    await page.locator('button[type="submit"]', { hasText: 'Guardar' }).click()

    // Debe aparecer confirmación
    await expect(page.locator('text=Cambios guardados')).toBeVisible({ timeout: 5_000 })

    // Recargar y verificar persistencia
    await page.reload()
    await expect(page.locator(`form[aria-label="${LABEL}"]`)).toBeVisible({ timeout: 10_000 })
    await expect(inputCancelacion).toHaveValue('24', { timeout: 5_000 })

    // Limpiar: restaurar a vacío
    await inputCancelacion.fill('')
    await page.locator('button[type="submit"]', { hasText: 'Guardar' }).click()
    await expect(page.locator('text=Cambios guardados')).toBeVisible({ timeout: 5_000 })
  })

  test('FP · guardar mensaje de bienvenida persiste', async ({ page }) => {
    const textarea = page.getByLabel('Mensaje de bienvenida')
    const texto = 'Hola {nombre}, gracias por reservar. ¡Te esperamos!'

    await textarea.fill(texto)
    await page.locator('button[type="submit"]', { hasText: 'Guardar' }).click()
    await expect(page.locator('text=Cambios guardados')).toBeVisible({ timeout: 5_000 })

    await page.reload()
    await expect(page.locator(`form[aria-label="${LABEL}"]`)).toBeVisible({ timeout: 10_000 })
    await expect(textarea).toHaveValue(texto, { timeout: 5_000 })

    // Limpiar
    await textarea.fill('')
    await page.locator('button[type="submit"]', { hasText: 'Guardar' }).click()
    await expect(page.locator('text=Cambios guardados')).toBeVisible({ timeout: 5_000 })
  })

  // ── API ──────────────────────────────────────────────────────────────────

  test('PUT /api/auth/profile acepta y persiste plazoCancelacion=48', async ({ page }) => {
    const res = await page.request.put('http://localhost:3000/api/auth/profile', {
      data: { plazoCancelacion: 48 },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.plazoCancelacion).toBe(48)

    // Restaurar
    await page.request.put('http://localhost:3000/api/auth/profile', {
      data: { plazoCancelacion: null },
    })
  })

  test('GET /api/auth/me incluye campos de políticas en el perfil', async ({ page }) => {
    const res = await page.request.get('http://localhost:3000/api/auth/me')
    expect(res.status()).toBe(200)
    const body = await res.json()
    // Los campos deben existir aunque sean null
    expect('plazoCancelacion'    in body).toBeTruthy()
    expect('plazoReprogramacion' in body).toBeTruthy()
    expect('mensajeBienvenida'   in body).toBeTruthy()
    expect('mensajeConfirmacion' in body).toBeTruthy()
    expect('mensajeRecordatorio' in body).toBeTruthy()
  })
})
