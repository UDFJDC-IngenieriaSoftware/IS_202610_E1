/* eslint-disable react-refresh/only-export-components */
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

/** Fallback mostrado mientras se descarga un chunk de página lazy. */
function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando página"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        color: 'var(--muted, #888)',
        fontSize: '14px',
        gap: '8px',
      }}
    >
      <span className="material-symbols-rounded" aria-hidden="true"
        style={{ animation: 'spin 1s linear infinite' }}>
        progress_activity
      </span>
      Cargando…
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      {/* Suspense global: muestra PageLoader mientras React descarga chunks lazy */}
      <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  </StrictMode>,
)
