/**
 * PublicLayout — envuelve las páginas públicas (landing).
 * Carga public.css y renderiza la página directamente (sin chrome extra).
 */
import { Outlet } from 'react-router-dom'
import '../../styles/public.css'

export function PublicLayout() {
  return <Outlet />
}
