/**
 * BarberPanelLayout — layout del panel del barbero.
 * Grid de 2 columnas: sidebar fijo + área de contenido con Outlet.
 * Protege la ruta: redirige a /login si no hay sesión de barbero.
 */
import { Outlet, Navigate } from 'react-router-dom'
import '../../styles/panel.css'
import { useAuth } from '../../hooks/useAuth'
import { BarberSidebar } from '../organisms/BarberSidebar'

export function BarberPanelLayout() {
  const { perfil, rol, loading } = useAuth()

  if (loading) return null

  if (!perfil || rol !== 'barbero') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app">
      <BarberSidebar />
      <main className="page">
        <Outlet />
      </main>
    </div>
  )
}
