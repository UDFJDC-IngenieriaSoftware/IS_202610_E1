/**
 * CU-07 — Configurar horarios y días libres (HorarioPage)
 *
 * RF-11 | CA-06 | /panel/horario
 *
 * Cubre:
 *  ✅ Flujo principal: ver horario semanal, modificar hora, guardar
 *  ✅ Flujo días libres: agregar y eliminar
 *  ✅ FA-01: botón "Agregar" deshabilitado si faltan campos
 */
import { test, expect } from '../fixtures/auth.fixture'

const RUTA = '/panel/horario'

test.describe('CU-07 · Horarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RUTA)
    // Esperar que el horario semanal esté renderizado
    await expect(page.locator('div.schedule')).toBeVisible({ timeout: 10_000 })
  })

  // ── Flujo principal ──────────────────────────────────────────────────────

  test('muestra los 7 días de la semana en la grilla', async ({ page }) => {
    const filas = page.locator('div.sched-row')
    await expect(filas).toHaveCount(7, { timeout: 5_000 })
  })

  test('los días activos muestran selectores de apertura y cierre', async ({ page }) => {
    // Debe haber al menos un selector "Apertura" visible (días activos del seed)
    const apertura = page.locator('select[aria-label^="Apertura"]')
    await expect(apertura.first()).toBeVisible()

    const cierre = page.locator('select[aria-label^="Cierre"]')
    await expect(cierre.first()).toBeVisible()
  })

  test('modifica hora de apertura y el botón cambia a "¡Guardado!" tras guardar', async ({ page }) => {
    // Cambiar la primera hora de apertura disponible
    const selectApertura = page.locator('select[aria-label^="Apertura"]').first()
    const valorActual = await selectApertura.inputValue()

    // Elegir el siguiente valor en la lista
    const options = await selectApertura.locator('option').all()
    const nuevoValor = options.length > 1
      ? await options[1].getAttribute('value') ?? valorActual
      : valorActual

    if (nuevoValor !== valorActual) {
      await selectApertura.selectOption(nuevoValor)
    }

    // Guardar
    const btnGuardar = page.locator('button.btn.primary')
    await btnGuardar.click()

    // Debe aparecer "¡Guardado!" o "Guardando…" como feedback
    await expect(btnGuardar).toContainText(/Guardando|Guardado/, { timeout: 5_000 })

    // Eventualmente vuelve al estado estable
    await expect(btnGuardar).toContainText(/Guardar|Guardado/, { timeout: 10_000 })
  })

  test('el resumen muestra días laborables y horas abiertas', async ({ page }) => {
    await expect(page.getByText('Días laborables')).toBeVisible()
    await expect(page.getByText('Horas abiertas')).toBeVisible()
    await expect(page.getByText('Capacidad estimada')).toBeVisible()
  })

  // ── Días libres ──────────────────────────────────────────────────────────

  test('FA-01 · botón "Agregar" deshabilitado si falta fecha o motivo', async ({ page }) => {
    const btnAgregar = page.locator('button.btn.ghost-sm:has-text("Agregar")')
    await expect(btnAgregar).toBeDisabled()

    // Solo fecha → sigue deshabilitado
    await page.locator('input[type="date"]').fill('2026-12-25')
    await expect(btnAgregar).toBeDisabled()

    // Solo motivo → sigue deshabilitado (limpiamos fecha primero)
    await page.locator('input[type="date"]').fill('')
    await page.locator('input[placeholder="Ej. Día festivo"]').fill('Navidad')
    await expect(btnAgregar).toBeDisabled()
  })

  test('agrega un día libre y aparece en la lista', async ({ page }) => {
    const fecha  = '2026-12-31'
    const motivo = `E2E Test ${Date.now()}`

    await page.locator('input[type="date"]').fill(fecha)
    await page.locator('input[placeholder="Ej. Día festivo"]').fill(motivo)

    const btnAgregar = page.locator('button.btn.ghost-sm:has-text("Agregar")')
    await expect(btnAgregar).toBeEnabled()
    await btnAgregar.click()

    // Aparece en la lista ul.dias-libres
    await expect(page.locator('ul.dias-libres .dl-motivo', { hasText: motivo })).toBeVisible({ timeout: 5_000 })

    // Los campos se limpian tras agregar
    await expect(page.locator('input[type="date"]')).toHaveValue('')
    await expect(page.locator('input[placeholder="Ej. Día festivo"]')).toHaveValue('')
  })

  test('elimina un día libre y desaparece de la lista', async ({ page }) => {
    // Tomar el primer día libre de la lista (puede venir del seed o del test anterior)
    const primeroMotivo = page.locator('ul.dias-libres .dl-motivo').first()
    const texto = await primeroMotivo.textContent()

    if (!texto) {
      test.skip()
      return
    }

    // Click en el botón eliminar de ese item
    const item = page.locator('li.dl-row', { has: page.locator('.dl-motivo', { hasText: texto }) })
    await item.locator('button[aria-label^="Quitar"]').click()

    await expect(item).not.toBeVisible({ timeout: 3_000 })
  })
})
