/**
 * AdminPanelLayout — layout del panel de administración de plataforma.
 * Grid de 2 columnas: sidebar fijo + área de contenido con Outlet.
 * Protege la ruta: redirige a /login si no hay sesión de admin.
 */
import { Outlet, Navigate } from 'react-router-dom'
import '../../styles/panel.css'
import '../../styles/admin.css'
import { useAuth } from '../../context/AuthContext'
import { AdminSidebar } from '../organisms/AdminSidebar'

export function AdminPanelLayout() {
  const { perfil, rol, loading } = useAuth()

  if (loading) return null

  if (!perfil || rol !== 'admin') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app">
      <AdminSidebar />
      <main className="page">
        <Outlet />
      </main>
    </div>
  )
}
