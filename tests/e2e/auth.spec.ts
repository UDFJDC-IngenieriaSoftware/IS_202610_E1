import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
    await page.evaluate(() => sessionStorage.clear())
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')
    // Assuming there's a login link or it redirects to login
    await expect(page).toHaveURL(/.*login|auth/)
  })

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/login')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Should show validation errors
    await expect(page.locator('text=Email inválido')).toBeVisible()
    await expect(page.locator('text=Mínimo 6 caracteres')).toBeVisible()
  })

  test('should show validation error on invalid email', async ({ page }) => {
    await page.goto('/login')

    // Fill invalid email
    await page.fill('input[type="email"]', 'not-an-email')
    await page.fill('input[type="password"]', 'password123')

    await page.click('button[type="submit"]')

    // Should show email validation error
    await expect(page.locator('text=Email inválido')).toBeVisible()
  })

  test('should navigate to register page from login', async ({ page }) => {
    await page.goto('/login')

    // Find and click register link
    const registerLink = page.locator('a:has-text("Registrarse"), a:has-text("Create account")')
    if (await registerLink.isVisible()) {
      await registerLink.click()
      await expect(page).toHaveURL(/.*register|signup/)
    }
  })

  test('should validate password confirmation on register', async ({ page }) => {
    await page.goto('/register')

    // Fill form with mismatched passwords
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password456')
    await page.fill('input[name="name"]', 'John Doe')

    await page.click('button[type="submit"]')

    // Should show password mismatch error
    await expect(page.locator('text=no coinciden')).toBeVisible()
  })

  test('should show loading state during login attempt', async ({ page }) => {
    await page.goto('/login')

    // Mock the API endpoint to delay response
    await page.route('**/api/auth/login', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      route.abort()
    })

    // Fill and submit
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Button should be disabled during loading
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeDisabled()
  })

  test('should handle API error gracefully', async ({ page }) => {
    await page.goto('/login')

    // Mock API error
    await page.route('**/api/auth/login', (route) => {
      route.abort('failed')
    })

    // Fill and submit
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=error')).toBeVisible({ timeout: 5000 })
  })
})
