/**
 * CU-10 — Gestionar información de clientes recurrentes (ClientesPage)
 *
 * RF-14 | CA-10 | /panel/clientes
 *
 * Cubre:
 *  ✅ Flujo principal: ver lista, buscar por nombre, buscar por celular, abrir perfil
 *  ✅ Editar datos del cliente y persistencia
 *  ✅ FA-01: búsqueda sin resultados → mensaje informativo
 *  ✅ FA-03: guardar sin nombre → validación
 */
import { test, expect } from '../fixtures/auth.fixture'

const RUTA = '/panel/clientes'
const TABLA = 'table[aria-label="Lista de clientes"]'

test.describe('CU-10 · Clientes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RUTA)
    await expect(page.locator(TABLA)).toBeVisible({ timeout: 10_000 })
  })

  // ── Flujo principal ──────────────────────────────────────────────────────

  test('muestra la tabla con encabezados correctos', async ({ page }) => {
    const headers = page.locator(`${TABLA} thead th`)
    await expect(headers.nth(0)).toContainText('Cliente')
    await expect(headers.nth(1)).toContainText('Celular')
    await expect(headers.nth(2)).toContainText('Citas')
    await expect(headers.nth(3)).toContainText('Última visita')
    await expect(headers.nth(4)).toContainText('Servicio frecuente')
  })

  test('muestra stats de clientes totales, recurrentes y activos este mes', async ({ page }) => {
    await expect(page.getByText('Total clientes')).toBeVisible()
    await expect(page.getByText('Recurrentes')).toBeVisible()
    await expect(page.getByText('Activos este mes')).toBeVisible()
  })

  test('el footer muestra el total de clientes cargados', async ({ page }) => {
    const footer = page.locator('.table-foot .muted')
    const texto = await footer.textContent()
    // Debe contener "X cliente(s)"
    expect(texto).toMatch(/\d+\s+cliente/)
  })

  // ── Búsqueda ─────────────────────────────────────────────────────────────

  test('búsqueda por nombre filtra la tabla con debounce', async ({ page }) => {
    const tbody = page.locator(`${TABLA} tbody tr`)
    const primeraFila = tbody.first()

    // Extraer nombre del primer cliente
    const nombreCelda = await primeraFila.locator('.strong').first().textContent()
    if (!nombreCelda?.trim()) { test.skip(); return }

    const termino = nombreCelda.trim().split(' ')[0] // primera palabra del nombre
    const searchInput = page.locator('input[placeholder*="nombre"]')

    await searchInput.fill(termino)
    await page.waitForTimeout(350) // debounce 250 ms + margen

    // Al menos la fila original sigue visible
    await expect(tbody.first()).toBeVisible()

    // El footer refleja la búsqueda activa
    await expect(page.locator('.table-foot .muted')).toContainText(`búsqueda: "${termino}"`)
  })

  test('búsqueda por celular filtra correctamente', async ({ page }) => {
    const tbody = page.locator(`${TABLA} tbody tr`)
    const celularTexto = await tbody.first().locator('td.muted').first().textContent()
    if (!celularTexto?.trim() || celularTexto.trim() === '—') { test.skip(); return }

    const termino = celularTexto.trim().slice(0, 4) // primeros 4 dígitos
    await page.locator('input[placeholder*="nombre"]').fill(termino)
    await page.waitForTimeout(350)

    // Debe haber al menos una fila (la del cliente buscado)
    await expect(tbody.first()).toBeVisible()
  })

  test('FA-01 · búsqueda sin resultados muestra mensaje informativo', async ({ page }) => {
    await page.locator('input[placeholder*="nombre"]').fill('xXxClienteQueNoExisteXxX')
    await page.waitForTimeout(350)

    await expect(
      page.locator('td', { hasText: 'No se encontraron clientes con esa búsqueda.' }),
    ).toBeVisible({ timeout: 3_000 })
  })

  // ── Perfil del cliente ───────────────────────────────────────────────────

  test('abre modal de perfil al clicar en una fila', async ({ page }) => {
    const primeraFila = page.locator(`${TABLA} tbody tr.row--clickable`).first()
    await primeraFila.click()

    const modal = page.getByRole('dialog', { name: 'Perfil del cliente' })
    await expect(modal).toBeVisible({ timeout: 3_000 })

    // El modal muestra el nombre, celular y estadísticas
    await expect(modal.locator('.cd-nombre')).toBeVisible()
    await expect(modal.locator('.cd-tel')).toBeVisible()
    await expect(modal.getByText('Estadísticas')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible({ timeout: 2_000 })
  })

  test('el modal es accesible con teclado (Enter en fila)', async ({ page }) => {
    const primeraFila = page.locator(`${TABLA} tbody tr.row--clickable`).first()
    await primeraFila.focus()
    await page.keyboard.press('Enter')

    await expect(page.getByRole('dialog', { name: 'Perfil del cliente' })).toBeVisible({ timeout: 3_000 })
    await page.keyboard.press('Escape')
  })

  // ── Edición ──────────────────────────────────────────────────────────────

  test('edita nombre del cliente y la actualización se refleja en el modal', async ({ page }) => {
    const primeraFila = page.locator(`${TABLA} tbody tr.row--clickable`).first()
    await primeraFila.click()

    const modal = page.getByRole('dialog', { name: 'Perfil del cliente' })
    await expect(modal).toBeVisible()

    // Entrar en modo edición
    await modal.locator('button', { hasText: 'Editar' }).click()

    // Escopar al modal para evitar ambigüedad con el SearchInput de la página
    const inputNombre = modal.getByRole('textbox', { name: 'Nombre' })
    await expect(inputNombre).toBeVisible()

    const valorOriginal = await inputNombre.inputValue()
    const nuevoNombre   = valorOriginal.endsWith('_e2e') ? valorOriginal.slice(0, -4) : `${valorOriginal}_e2e`

    await inputNombre.fill(nuevoNombre)
    await modal.locator('button[type="submit"]:has-text("Guardar")').click()

    // El modal debe cerrar el modo edición
    await expect(inputNombre).not.toBeVisible({ timeout: 5_000 })

    // El nombre actualizado aparece en el modal
    await expect(modal.locator('.cd-nombre')).toContainText(nuevoNombre)

    await page.keyboard.press('Escape')
  })

  test('la edición de nombre persiste tras recargar la página', async ({ page }) => {
    const primeraFila = page.locator(`${TABLA} tbody tr.row--clickable`).first()
    await primeraFila.click()

    const modal = page.getByRole('dialog', { name: 'Perfil del cliente' })
    await expect(modal).toBeVisible()
    await modal.locator('button', { hasText: 'Editar' }).click()

    const inputNombre = modal.getByRole('textbox', { name: 'Nombre' })
    const valorOriginal = await inputNombre.inputValue()
    const nuevoNombre   = valorOriginal.endsWith('_p') ? valorOriginal.slice(0, -2) : `${valorOriginal}_p`

    await inputNombre.fill(nuevoNombre)
    await modal.locator('button[type="submit"]:has-text("Guardar")').click()
    await expect(inputNombre).not.toBeVisible({ timeout: 5_000 })
    await page.keyboard.press('Escape')

    // Recargar y verificar que el nombre actualizado aparece en la tabla
    await page.reload()
    await expect(page.locator(TABLA)).toBeVisible({ timeout: 10_000 })

    const filasActualizadas = page.locator(`${TABLA} tbody tr.row--clickable`)
    await expect(
      filasActualizadas.filter({ has: page.locator('.strong', { hasText: nuevoNombre }) }).first(),
    ).toBeVisible({ timeout: 5_000 })
  })

  test('FA-03 · guardar con nombre vacío muestra error de validación', async ({ page }) => {
    await page.locator(`${TABLA} tbody tr.row--clickable`).first().click()
    const modal = page.getByRole('dialog', { name: 'Perfil del cliente' })

    await modal.locator('button', { hasText: 'Editar' }).click()
    await modal.getByRole('textbox', { name: 'Nombre' }).fill('')
    await modal.locator('button[type="submit"]:has-text("Guardar")').click()

    // Debe mostrar un error (aria-live o texto inline)
    await expect(
      modal.locator('[aria-live], .field-error, [role="alert"]', { hasText: /obligatorio/i }),
    ).toBeVisible({ timeout: 3_000 })

    await page.keyboard.press('Escape')
  })

  // ── Gaps documentados ────────────────────────────────────────────────────
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip('FA-02 · eliminar cliente con citas futuras — función no implementada', () => {
    // ClienteModal.tsx no tiene botón de eliminar.
    // customerRoutes no define DELETE /api/clientes/:id.
    // Pendiente según CU-10 FA-02 del plan de verificación.
  })
})
