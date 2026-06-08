import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration — MI TURNO
 *
 * Proyectos:
 *   setup     → auth.setup.ts: login real, guarda storageState
 *   chromium  → tests UI del Panel Web (depende de setup)
 *   firefox   → mismos tests UI en Firefox
 *   api       → tests de API del backend (tests/e2e/api/*.spec.ts)
 *
 * Correr:
 *   npx playwright test                    # todos
 *   npx playwright test --project=api      # solo API
 *   npx playwright test --project=chromium # solo UI Chrome
 *   npx playwright test tests/e2e/panel/   # solo tests del panel
 */
export default defineConfig({
  globalSetup:    './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',

  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // ── 1. Setup: crea la sesión autenticada ─────────────────────────────────
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },

    // ── 2. UI tests – Panel Web ───────────────────────────────────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/barbero.json',
      },
      dependencies: ['setup'],
      testIgnore: ['**/api/**', '**/auth.setup.ts'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/barbero.json',
      },
      dependencies: ['setup'],
      testIgnore: ['**/api/**', '**/auth.setup.ts'],
    },

    // ── 3. API tests – Backend ────────────────────────────────────────────────
    {
      name: 'api',
      use: {
        baseURL: process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:3000',
      },
      testMatch: ['**/api/**/*.spec.ts'],
    },
  ],

  webServer: {
    // Ejecutar desde la raíz del repo; el frontend está en ./frontend/
    command: 'cd frontend && npx vite',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
