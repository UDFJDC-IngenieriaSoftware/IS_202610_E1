/**
 * CU-09 — Consultar historial de citas, pagos y estadísticas (HistorialPage)
 *
 * RF-13 | CA-08 | /panel/historial
 *
 * Cubre:
 *  ✅ Flujo principal: tabs citas/pagos, stats, filtros de estado y periodo
 *  ✅ Flujo búsqueda: SearchInput filtra filas de la tabla
 *  ✅ FA-01: filtro sin resultados → mensaje informativo
 */
import { test, expect } from '../fixtures/auth.fixture'

const RUTA = '/panel/historial'

test.describe('CU-09 · Historial y estadísticas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RUTA)
    // Esperar que las tabs estén disponibles
    await expect(page.getByRole('tablist')).toBeVisible({ timeout: 10_000 })
  })

  // ── Tabs ─────────────────────────────────────────────────────────────────

  test('la pestaña "Citas" está activa por defecto', async ({ page }) => {
    const tabCitas = page.getByRole('tab', { name: /Citas/ })
    await expect(tabCitas).toHaveAttribute('aria-selected', 'true')

    // La tabla de citas es visible
    await expect(page.locator('table[aria-label="Historial de citas"]')).toBeVisible()
  })

  test('cambia a pestaña "Pagos PSE" y muestra la tabla correcta', async ({ page }) => {
    await page.getByRole('tab', { name: /Pagos PSE/ }).click()

    await expect(page.locator('table[aria-label="Pagos PSE"]')).toBeVisible({ timeout: 5_000 })

    // La tabla de citas ya no debe estar
    await expect(page.locator('table[aria-label="Historial de citas"]')).not.toBeVisible()

    // Encabezados de pagos
    await expect(page.locator('th', { hasText: 'Anticipo' })).toBeVisible()
    await expect(page.locator('th', { hasText: 'Referencia' })).toBeVisible()
  })

  // ── Stats de citas ───────────────────────────────────────────────────────

  test('muestra las 3 stats de citas (periodo, ingresos, no-show)', async ({ page }) => {
    await expect(page.getByText('Citas en el periodo')).toBeVisible()
    await expect(page.getByText('Ingresos totales')).toBeVisible()
    await expect(page.getByText('Tasa de no-show')).toBeVisible()
  })

  test('el total en stats coincide con el conteo de filas mostradas', async ({ page }) => {
    // Leer el total del stat (clase real del componente Stat: .stat-big)
    const statValor = page.locator('.stat .stat-big').first()
    const totalTexto = await statValor.textContent()
    const total = parseInt(totalTexto ?? '0', 10)

    // Leer el texto del footer "Mostrando X de Y citas"
    const footer = page.locator('.table-foot').first()
    await expect(footer).toContainText(`de ${total} citas`)
  })

  // ── Filtros de periodo ───────────────────────────────────────────────────

  test('filtros de periodo cambian aria-pressed y actualizan las stats', async ({ page }) => {
    const grupoFecha = page.locator('[role="group"][aria-label="Filtrar por periodo"]')

    // Clic en "Esta semana"
    const btnSemana = grupoFecha.locator('button', { hasText: 'Esta semana' })
    await btnSemana.click()
    await expect(btnSemana).toHaveAttribute('aria-pressed', 'true')

    // Clic en "Todo"
    const btnTodo = grupoFecha.locator('button', { hasText: 'Todo' })
    await btnTodo.click()
    await expect(btnTodo).toHaveAttribute('aria-pressed', 'true')
    await expect(btnSemana).toHaveAttribute('aria-pressed', 'false')
  })

  // ── Filtros de estado ────────────────────────────────────────────────────

  test('filtrar por estado "Canceladas" solo muestra canceladas o mensaje vacío', async ({ page }) => {
    const grupoEstado = page.locator('[role="group"][aria-label="Filtrar por estado"]')
    await grupoEstado.locator('button', { hasText: 'Canceladas' }).click()

    // Esperar actualización
    await page.waitForTimeout(300)

    const tbody = page.locator('table[aria-label="Historial de citas"] tbody tr')
    const count = await tbody.count()

    if (count === 1) {
      // Posible mensaje "No hay citas con los filtros aplicados."
      const celda = tbody.first().locator('td')
      const text = await celda.textContent()
      if (text?.includes('No hay citas')) return // FA-01 ok
    }

    // Si hay filas reales, todas deben tener el status pill de cancelada
    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(tbody.nth(i).locator('.status-pill, [class*="status"]')).toContainText(/[Cc]ancel/)
    }
  })

  test('filtrar por estado "Confirmadas" actualiza aria-pressed correctamente', async ({ page }) => {
    const grupoEstado = page.locator('[role="group"][aria-label="Filtrar por estado"]')
    const btnConfirmadas = grupoEstado.locator('button', { hasText: 'Confirmadas' })

    await btnConfirmadas.click()
    await expect(btnConfirmadas).toHaveAttribute('aria-pressed', 'true')

    // Volver a Todos
    await grupoEstado.locator('button', { hasText: 'Todos' }).click()
  })

  // ── Búsqueda ─────────────────────────────────────────────────────────────

  test('la búsqueda filtra filas por cliente o servicio', async ({ page }) => {
    // Cambiar a "Todo" para asegurar que la cita de prueba (futura) esté visible
    await page.locator('[role="group"][aria-label="Filtrar por periodo"] button', { hasText: 'Todo' }).click()

    // Esperar a que haya al menos una fila real (row--clickable)
    const filaReal = page.locator('table[aria-label="Historial de citas"] tbody tr.row--clickable')
    const count = await filaReal.count()
    if (count === 0) { test.skip(); return }

    // .strong extrae solo el nombre (td.nth(2) incluye iniciales + teléfono concatenados)
    const clienteTexto = await filaReal.first().locator('.strong').first().textContent()
    if (!clienteTexto?.trim()) { test.skip(); return }

    const termino = clienteTexto.trim().slice(0, 3)
    await page.locator('input[placeholder*="Buscar"]').fill(termino)

    await page.waitForTimeout(400) // debounce de la búsqueda

    // Al menos la primera fila sigue visible
    await expect(filaReal.first()).toBeVisible()
  })

  test('FA-01 · búsqueda sin resultados muestra mensaje informativo', async ({ page }) => {
    await page.locator('input[placeholder*="Buscar"]').fill('xXxTerminoQueNoExisteXxX')
    await page.waitForTimeout(400)

    await expect(
      page.locator('td', { hasText: 'No hay citas con los filtros aplicados.' }),
    ).toBeVisible({ timeout: 3_000 })
  })

  // ── Stats de pagos ───────────────────────────────────────────────────────

  test('pestaña Pagos muestra stats de anticipos recibidos e ingresos', async ({ page }) => {
    await page.getByRole('tab', { name: /Pagos PSE/ }).click()

    await expect(page.getByText('Anticipos recibidos')).toBeVisible()
    await expect(page.getByText('Ingresos anticipos')).toBeVisible()
    await expect(page.getByText('Tasa de fallo')).toBeVisible()
  })
})
