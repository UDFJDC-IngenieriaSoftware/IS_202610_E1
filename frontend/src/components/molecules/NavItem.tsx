/**
 * Molécula NavItem — ítem del sidebar con icono, label y estado activo.
 * Usa NavLink de react-router para gestionar aria-current automáticamente.
 */
import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import { Icon } from '../atoms/Icon'
import type { IconName } from '../../types/icons'

interface NavItemProps {
  to: string
  icon: IconName
  label: string
}

export const NavItem = memo(function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `nav-item${isActive ? ' is-active' : ''}`
      }
      aria-current={undefined}   // NavLink ya gestiona aria-current="page"
    >
      <Icon name={icon} size={18} />
      {label}
    </NavLink>
  )
})
