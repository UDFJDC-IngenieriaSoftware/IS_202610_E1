/**
 * Molécula QuickAction — tarjeta de acción rápida con icono, título y subtítulo.
 */
import { memo, type ReactNode } from 'react'
import { Icon } from '../atoms/Icon'
import type { IconName } from '../../types/icons'

interface QuickActionProps {
  icon?: IconName
  iconNode?: ReactNode
  label: string
  sub?: string
  onClick: () => void
}

export const QuickAction = memo(function QuickAction({
  icon,
  iconNode,
  label,
  sub,
  onClick,
}: QuickActionProps) {
  return (
    <button type="button" className="qa-card" onClick={onClick}>
      <span className="qa-icon">
        {iconNode ?? (icon && <Icon name={icon} size={18} />)}
      </span>
      <span className="qa-text">
        <span className="qa-label">{label}</span>
        {sub && <span className="qa-sub">{sub}</span>}
      </span>
    </button>
  )
})
