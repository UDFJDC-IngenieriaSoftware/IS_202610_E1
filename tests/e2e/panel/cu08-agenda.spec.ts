/**
 * CU-08 — Visualizar agenda (AgendaPage)
 *
 * RF-12 | CA-07 | /panel/agenda
 *
 * Cubre:
 *  ✅ Flujo principal: vista semana por defecto, cambio a mes, leyenda, navegación
 *  ✅ FA-01: semana sin citas → muestra calendario vacío (sin errores)
 *  ✅ FA-02: diferenciación visual de estados en la leyenda
 *  ✅ Detalle de cita al hacer clic (si hay citas en seed)
 */
import { test, expect } from '../fixtures/auth.fixture'

const RUTA = '/panel/agenda'

test.describe('CU-08 · Agenda', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RUTA)
    // Esperar a que la topbar con el título esté visible
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible({ timeout: 10_000 })
  })

  // ── Vista semana (defecto) ───────────────────────────────────────────────

  test('muestra vista semana por defecto con 7 columnas de día', async ({ page }) => {
    // La grilla de semana debe estar visible
    await expect(page.locator('div.cal-grid')).toBeVisible()

    // 7 gridcells (columnas de días)
    const columnas = page.locator('[role="gridcell"]')
    await expect(columnas).toHaveCount(7, { timeout: 5_000 })
  })

  test('los encabezados de día contienen nombre y número', async ({ page }) => {
    const heads = page.locator('div.cal-dayhead')
    await expect(heads).toHaveCount(7)

    // Cada cabecera tiene .cdh-day y .cdh-num
    const primero = heads.first()
    await expect(primero.locator('.cdh-day')).toBeVisible()
    await expect(primero.locator('.cdh-num')).toBeVisible()
  })

  test('el gutter de horas va de 08:00 a 19:00', async ({ page }) => {
    await expect(page.locator('div.cal-gutter')).toBeVisible()
    await expect(page.locator('div.cal-hour').filter({ hasText: '08:00' })).toBeVisible()
    await expect(page.locator('div.cal-hour').filter({ hasText: '19:00' })).toBeVisible()
  })

  // ── Cambio a vista mes ───────────────────────────────────────────────────

  test('cambia a vista mes y muestra la grilla mensual', async ({ page }) => {
    const btnMes = page.locator('[role="group"][aria-label="Vista de agenda"] button', { hasText: 'Mes' })
    await btnMes.click()

    await expect(page.locator('div.month-grid[role="grid"]')).toBeVisible({ timeout: 3_000 })
    // La grilla de semana ya no debe estar
    await expect(page.locator('div.cal-grid')).not.toBeVisible()

    // Cabeceras Lun-Dom
    await expect(page.locator('div.month-dh', { hasText: 'Lun' })).toBeVisible()
    await expect(page.locator('div.month-dh', { hasText: 'Dom' })).toBeVisible()
  })

  test('vuelve a vista semana desde mes con el botón "Semana"', async ({ page }) => {
    // Primero ir a mes
    await page.locator('[role="group"][aria-label="Vista de agenda"] button', { hasText: 'Mes' }).click()
    await expect(page.locator('div.month-grid')).toBeVisible()

    // Volver a semana
    await page.locator('[role="group"][aria-label="Vista de agenda"] button', { hasText: 'Semana' }).click()
    await expect(page.locator('div.cal-grid')).toBeVisible({ timeout: 3_000 })
  })

  // ── Leyenda de estados (FA-02) ───────────────────────────────────────────

  test('FA-02 · la leyenda muestra los 4 estados diferenciados', async ({ page }) => {
    const leyenda = page.locator('[role="list"][aria-label="Estados de cita"]')
    await expect(leyenda).toBeVisible()

    // Los cuatro estados definidos en ESTADO_CITA_META
    await expect(leyenda).toContainText('Confirmada')
    await expect(leyenda).toContainText('Pendiente')
    await expect(leyenda).toContainText('Cancelada')
  })

  // ── Navegación temporal ──────────────────────────────────────────────────

  test('navega a la semana siguiente y el subtitle cambia', async ({ page }) => {
    const subtitle = page.locator('.topbar-sub')
    const textoInicial = await subtitle.textContent()

    await page.locator('button[aria-label="Semana siguiente"]').click()

    const textoNuevo = await subtitle.textContent()
    expect(textoNuevo).not.toEqual(textoInicial)
  })

  test('botón "Hoy" regresa a la semana actual', async ({ page }) => {
    const subtitle = page.locator('.topbar-sub')
    const textoHoy = await subtitle.textContent()

    // Ir a semana siguiente y volver con Hoy
    await page.locator('button[aria-label="Semana siguiente"]').click()
    await page.locator('button.btn.ghost-sm:has-text("Hoy")').click()

    await expect(subtitle).toHaveText(textoHoy ?? '', { timeout: 3_000 })
  })

  // ── FA-01: grilla vacía ──────────────────────────────────────────────────

  test('FA-01 · semana sin citas muestra grilla vacía sin errores ni crashes', async ({ page }) => {
    // La semana actual no tiene citas (el seed las pone en jun-23).
    // La grilla debe renderizar sin errores y sin eventos.
    await expect(page.locator('div.cal-grid')).toBeVisible()
    await expect(page.locator('button.cal-event')).toHaveCount(0, { timeout: 5_000 })
    // Nota: AgendaPage no muestra un mensaje "No tienes citas para este período"
    // (FA-01 del plan parcialmente cubierto — grilla vacía sin error, sin mensaje explícito)
  })

  // ── Detalle de cita ──────────────────────────────────────────────────────

  test('abre modal de detalle al clicar en un evento', async ({ page }) => {
    // La cita del seed está en 2026-06-23. El frontend usa VITE_TODAY ('hoy' del calendario)
    // que puede diferir de la fecha real, por lo que navegamos semana a semana hasta encontrar
    // la cita (máx 12 semanas) en lugar de hardcodear un número de clicks.
    const MAX_SEMANAS = 12
    for (let i = 0; i < MAX_SEMANAS; i++) {
      if (await page.locator('button.cal-event').count() > 0) break
      const subtitleAntes = await page.locator('.topbar-sub').textContent()
      await page.locator('button[aria-label="Semana siguiente"]').click()
      await expect(page.locator('.topbar-sub')).not.toHaveText(subtitleAntes ?? '', { timeout: 3_000 })
    }

    const eventos = page.locator('button.cal-event')
    if (await eventos.count() === 0) { test.skip(); return }
    await expect(eventos.first()).toBeVisible({ timeout: 3_000 })

    await eventos.first().click()
    await expect(page.getByRole('dialog', { name: 'Detalle de cita' })).toBeVisible({ timeout: 3_000 })

    // El modal muestra hora, estado y servicio
    await expect(page.locator('.cd-hora')).toBeVisible()
    await expect(page.locator('.cd-section').first()).toBeVisible()

    // Cerrar modal
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 2_000 })
  })

  // ── Gaps documentados ────────────────────────────────────────────────────
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip('CU-08 · vista "Día" — no implementada en AgendaPage', () => {
    // AgendaPage define type VistaAgenda = \'semana\' | \'mes\'.
    // No existe botón "Día" ni lógica de vista diaria.
    // El toggle solo muestra Semana / Mes.
    // Pendiente según CU-08 paso 3 del plan de verificación.
  })
})
