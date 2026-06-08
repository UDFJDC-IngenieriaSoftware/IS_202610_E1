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
  // Serial: FA-02 y persist modifican estado compartido (horario del barbero)
  test.describe.configure({ mode: 'serial' })

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

  test('la modificación de horario persiste tras recargar la página', async ({ page }) => {
    const selectApertura = page.locator('select[aria-label^="Apertura"]').first()
    const selectCierre   = page.locator('select[aria-label^="Cierre"]').first()
    const aperturaOriginal = await selectApertura.inputValue()

    // Seleccionar la siguiente opción disponible como nuevo valor
    const options = await selectApertura.locator('option').all()
    const nuevoValor = options.length > 1
      ? (await options[1].getAttribute('value')) ?? aperturaOriginal
      : aperturaOriginal

    if (nuevoValor === aperturaOriginal) { test.skip(); return }

    await selectApertura.selectOption(nuevoValor)
    const btnGuardar = page.locator('button.btn.primary')
    await btnGuardar.click()
    await expect(btnGuardar).toContainText(/Guardado/, { timeout: 5_000 })

    // Recargar y verificar persistencia
    await page.reload()
    await expect(page.locator('div.schedule')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('select[aria-label^="Apertura"]').first()).toHaveValue(nuevoValor)

    // Restaurar valor original para no contaminar tests posteriores
    await page.locator('select[aria-label^="Apertura"]').first().selectOption(aperturaOriginal)
    // Asegurar que cierre sigue siendo mayor que la apertura restaurada
    const cierreActual = await selectCierre.inputValue()
    if (cierreActual <= aperturaOriginal) {
      // Buscar primera opción mayor que apertura
      for (const opt of options) {
        const val = await opt.getAttribute('value') ?? ''
        if (val > aperturaOriginal) { await selectCierre.selectOption(val); break }
      }
    }
    await page.locator('button.btn.primary').click()
    await expect(page.locator('button.btn.primary')).toContainText(/Guardado/, { timeout: 5_000 })
  })

  test('FA-02 · cierre igual a apertura → backend rechaza y el botón no muestra "¡Guardado!"', async ({ page }) => {
    const selectApertura = page.locator('select[aria-label^="Apertura"]').first()
    const selectCierre   = page.locator('select[aria-label^="Cierre"]').first()
    const aperturaVal = await selectApertura.inputValue()
    const cierreOriginal = await selectCierre.inputValue()

    // Poner cierre == apertura → backend devuelve 400 "La hora inicial debe ser anterior a la hora final"
    await selectCierre.selectOption(aperturaVal)

    const btnGuardar = page.locator('button.btn.primary')
    await btnGuardar.click()

    // Esperar que la petición falle y el UI vuelva a estado estable
    await page.waitForTimeout(2_000)

    // No debe aparecer "¡Guardado!" — el error del servidor fue recibido
    await expect(btnGuardar).not.toContainText('¡Guardado!')
    await expect(btnGuardar).toContainText('Guardar cambios')

    // Restaurar cierre original para no dejar el horario inválido
    await selectCierre.selectOption(cierreOriginal)
    await btnGuardar.click()
    await expect(btnGuardar).toContainText(/Guardado/, { timeout: 5_000 })
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
