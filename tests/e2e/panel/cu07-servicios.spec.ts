/**
 * CU-07 — Configurar servicios (ServiciosPage)
 *
 * RF-11 | CA-06 | /panel/servicios
 *
 * Cubre:
 *  ✅ Flujo principal: ver catálogo, crear, editar, toggle, eliminar
 *  ✅ FA-01: validación de campos obligatorios (nombre vacío, precio inválido)
 */
import { test, expect } from '../fixtures/auth.fixture'

const RUTA = '/panel/servicios'
const TABLA = 'table[aria-label="Servicios del barbero"]'

// Nombre único por ejecución para no colisionar entre runs
const NOMBRE_TEST = `Servicio E2E ${Date.now()}`

test.describe('CU-07 · Servicios', () => {
  // Serial: los tests 2-5 dependen del servicio creado en el test 1
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await page.goto(RUTA)
    await expect(page.locator(TABLA)).toBeVisible({ timeout: 10_000 })
  })

  // ── Flujo principal ──────────────────────────────────────────────────────

  test('muestra la tabla de catálogo con encabezados correctos', async ({ page }) => {
    const headers = page.locator(`${TABLA} thead th`)
    await expect(headers.nth(0)).toContainText('Servicio')
    await expect(headers.nth(1)).toContainText('Duración')
    await expect(headers.nth(2)).toContainText('Precio')
    await expect(headers.nth(3)).toContainText('Anticipo')
    await expect(headers.nth(4)).toContainText('Estado')
  })

  test('las stats resumen reflejan los servicios activos', async ({ page }) => {
    // Hay al menos una stat visible con label "Servicios activos"
    await expect(page.getByText('Servicios activos')).toBeVisible()
    await expect(page.getByText('Precio promedio')).toBeVisible()
    await expect(page.getByText('Duración promedio')).toBeVisible()
  })

  test('crea un servicio nuevo y aparece en la tabla', async ({ page }) => {
    await page.click('button.btn.primary:has-text("Agregar servicio")')

    // Modal visible
    await expect(page.getByRole('dialog')).toBeVisible()

    // Rellenar formulario
    await page.getByLabel('Nombre del servicio').fill(NOMBRE_TEST)
    await page.getByLabel('Descripción').fill('Servicio de prueba automatizada')
    await page.getByLabel('Precio (COP)').fill('35000')

    // Guardar
    await page.click('button[type="submit"]:has-text("Guardar")')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 })

    // Aparece en la tabla
    await expect(page.locator('.svc-name', { hasText: NOMBRE_TEST })).toBeVisible()
  })

  test('edita un servicio existente y persiste el cambio', async ({ page }) => {
    // Localizar la fila del servicio creado en el test anterior
    const fila = page.locator('tr', { has: page.locator('.svc-name', { hasText: NOMBRE_TEST }) })
    await fila.locator(`button[aria-label^="Editar"]`).click()

    await expect(page.getByRole('dialog')).toBeVisible()

    const precioInput = page.getByLabel('Precio (COP)')
    await precioInput.fill('40000')

    await page.click('button[type="submit"]:has-text("Guardar")')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 })

    // La fila ahora muestra el nuevo precio (40.000 formateado en COP)
    await expect(fila.locator('.num.strong')).toContainText('40')
  })

  test('toggle pausa y reactiva un servicio (optimistic UI)', async ({ page }) => {
    const fila = page.locator('tr', { has: page.locator('.svc-name', { hasText: NOMBRE_TEST }) })

    // Estado inicial: activo → row no tiene clase row--off
    await expect(fila).not.toHaveClass(/row--off/)

    // Click en el label del toggle (el input checkbox está oculto visualmente)
    await fila.locator('label.toggle').click()
    await expect(fila).toHaveClass(/row--off/, { timeout: 3_000 })

    // Click de nuevo → activo otra vez
    await fila.locator('label.toggle').click()
    await expect(fila).not.toHaveClass(/row--off/, { timeout: 3_000 })
  })

  test('elimina el servicio de prueba y desaparece de la tabla', async ({ page }) => {
    const fila = page.locator('tr', { has: page.locator('.svc-name', { hasText: NOMBRE_TEST }) })
    await fila.locator(`button[aria-label^="Eliminar"]`).click()

    // Desaparece optimistamente
    await expect(fila).not.toBeVisible({ timeout: 3_000 })
  })

  // ── FA-01: validación ────────────────────────────────────────────────────

  test('FA-01 · muestra error si el nombre está vacío', async ({ page }) => {
    await page.click('button.btn.primary:has-text("Agregar servicio")')
    await expect(page.getByRole('dialog')).toBeVisible()

    // Dejar nombre vacío y enviar
    await page.getByLabel('Nombre del servicio').fill('')
    await page.click('button[type="submit"]:has-text("Guardar")')

    await expect(page.locator('[role="alert"]', { hasText: 'obligatorio' })).toBeVisible()
    // Modal permanece abierto
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.keyboard.press('Escape')
  })

  test('FA-01 · muestra error si el precio es menor a $1.000', async ({ page }) => {
    await page.click('button.btn.primary:has-text("Agregar servicio")')
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByLabel('Nombre del servicio').fill('Test precio')
    await page.getByLabel('Precio (COP)').fill('500')
    await page.click('button[type="submit"]:has-text("Guardar")')

    await expect(page.locator('[role="alert"]', { hasText: 'mínimo' })).toBeVisible()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.keyboard.press('Escape')
  })
})
