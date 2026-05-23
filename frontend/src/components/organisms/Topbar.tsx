/**
 * Organismo Topbar — cabecera de página con título, subtítulo,
 * buscador y área de acciones.
 */
import type { ReactNode } from 'react'
import { SearchInput } from '../molecules/SearchInput'
import { IconButton } from '../atoms/IconButton'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  search?: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
  }
  hasNotifications?: boolean
}

export function Topbar({
  title,
  subtitle,
  actions,
  search,
  hasNotifications = false,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-text">
        <h1 className="topbar-title">{title}</h1>
        {subtitle && <p className="topbar-sub">{subtitle}</p>}
      </div>
      <div className="topbar-actions">
        {search && (
          <SearchInput
            value={search.value}
            onChange={search.onChange}
            placeholder={search.placeholder ?? 'Buscar…'}
            kbd="⌘K"
          />
        )}
        <IconButton
          icon="notifications"
          label="Notificaciones"
          ghost
          dot={hasNotifications}
          size={18}
        />
        {actions}
      </div>
    </header>
  )
}
