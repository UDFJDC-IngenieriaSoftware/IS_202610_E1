import { defineConfig } from 'vite'
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
})
