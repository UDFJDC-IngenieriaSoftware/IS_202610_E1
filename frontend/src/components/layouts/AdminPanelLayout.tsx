/**
 * AdminPanelLayout — layout del panel de administración de plataforma.
 * Grid de 2 columnas: sidebar fijo + área de contenido con Outlet.
 * Protege la ruta: redirige a /login si no hay sesión de admin.
 *
 * Accesibilidad:
 *  - Skip-link "Saltar al contenido" para usuarios de teclado.
 *  - <main id="main-content"> como destino del skip-link.
 *  - Spinner accesible durante la carga (role="status" aria-live="polite").
 */
import { Outlet, Navigate } from 'react-router-dom'
import '../../styles/panel.css'
import '../../styles/admin.css'
import { useAuth } from '../../hooks/useAuth'
import { AdminSidebar } from '../organisms/AdminSidebar'
import { LoadingSpinner } from '../atoms/LoadingSpinner'

export function AdminPanelLayout() {
  const { perfil, rol, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100dvh' }}>
        <LoadingSpinner label="Cargando panel de administración…" size="lg" />
      </div>
    )
  }

  if (!perfil || rol !== 'admin') {
    return <Navigate to="/login" replace />
  }

  return (
    <>
      {/* Skip-link: visible solo al recibir foco (usuarios de teclado / lector de pantalla) */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>

      <div className="app">
        <AdminSidebar />
        <main id="main-content" className="page">
          <Outlet />
        </main>
      </div>
    </>
  )
}
