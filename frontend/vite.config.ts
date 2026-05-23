import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Apuntar a navegadores modernos — aprovecha top-level await, ESM nativo, etc.
    target: 'es2022',

    // Umbral para inlining de assets como data URI (default 4 KB está bien)
    assetsInlineLimit: 4096,

    // Evita calcular tamaños gzip en modo CI para builds más rápidos
    reportCompressedSize: false,

    rollupOptions: {
      output: {
        /**
         * Dividir el bundle en chunks lógicos:
         * - react-vendor  : react + react-dom (cambia poco, cache larga)
         * - router        : react-router-dom
         * - vendor        : resto de node_modules
         * - Las páginas quedan en chunks propios gracias a lazy() en App.tsx
         */
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/')) {
              return 'react-vendor'
            }
            if (id.includes('react-router')) {
              return 'router'
            }
            return 'vendor'
          }
        },
      },
    },
  },

  // ── Vitest ────────────────────────────────────────────────────────────────────
  test: {
    /** jsdom emula el DOM del browser en Node.js */
    environment: 'jsdom',

    /** Expone describe/it/expect/vi globalmente sin importarlos */
    globals: true,

    /** Archivo de setup: registra jest-dom matchers y arranca el servidor MSW */
    setupFiles: ['./test/setup.ts'],

    /** Solo ejecuta los archivos dentro de /test/ */
    include: ['test/**/*.test.{ts,tsx}'],

    /** Variables de entorno fijas para tests (simula import.meta.env.VITE_*) */
    env: {
      VITE_USE_MOCKS: 'false',
      VITE_API_URL: 'http://localhost:3000',
      VITE_TODAY: '2026-05-08',   // fecha fija para pruebas deterministas
    },

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**'],
      exclude: [
        'src/**/*.mock.ts',
        'src/main.tsx',
        'src/App.tsx',
        'src/**/*.d.ts',
      ],
    },
  },
})
