/**
 * AuthLayout — envuelve /login y /registro.
 * Carga public.css (comparte tokens y estilos .auth-shell).
 * Redirige al panel si ya hay sesión activa.
 */
import { Outlet, Navigate } from 'react-router-dom'
import '../../styles/public.css'
import { useAuth } from '../../context/AuthContext'

export function AuthLayout() {
  const { perfil, rol, loading } = useAuth()

  if (loading) return null

  if (perfil) {
    return <Navigate to={rol === 'admin' ? '/admin/dashboard' : '/panel/dashboard'} replace />
  }

  return <Outlet />
}
