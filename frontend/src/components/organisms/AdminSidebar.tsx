/**
 * Organismo AdminSidebar — sidebar del panel de administración de plataforma.
 */
import { useNavigate } from 'react-router-dom'
import { NavItem } from '../molecules/NavItem'
import { Avatar } from '../atoms/Avatar'
import { IconButton } from '../atoms/IconButton'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/admin/dashboard',     icon: 'admin_panel_settings', label: 'Dashboard'     },
  { to: '/admin/barberos',      icon: 'group',                label: 'Barberos'      },
  { to: '/admin/suscripciones', icon: 'subscriptions',        label: 'Suscripciones' },
  { to: '/admin/planes',        icon: 'layers',               label: 'Planes'        },
  { to: '/admin/pagos',         icon: 'payments',             label: 'Pagos'         },
  { to: '/admin/soporte',       icon: 'support_agent',        label: 'Soporte'       },
] as const

export function AdminSidebar() {
  const { perfil, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Marca */}
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
            <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
          </svg>
        </div>
        <div>
          <div className="brand-name">MiTurno</div>
          <div className="brand-sub">Admin plataforma</div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav" aria-label="Menú de administración">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
        ))}
      </nav>

      {/* Pie — usuario admin */}
      <div className="sidebar-foot">
        <div className="user-row">
          <Avatar nombre={perfil?.nombre ?? 'Admin'} size="md" />
          <div className="user-meta">
            <div className="user-name">{perfil?.nombre ?? 'Administrador'}</div>
            <div className="user-sub">Plataforma</div>
          </div>
          <IconButton
            icon="logout"
            label="Cerrar sesión"
            ghost
            size={16}
            onClick={handleLogout}
          />
        </div>
      </div>
    </aside>
  )
}
