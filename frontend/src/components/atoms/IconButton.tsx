/**
 * Átomo IconButton — botón cuadrado solo-icono con aria-label obligatorio.
 */
import type { ButtonHTMLAttributes } from 'react'
import { Icon } from './Icon'
import type { IconName } from '../../types/icons'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName
  label: string          // aria-label obligatorio (accesibilidad)
  ghost?: boolean
  dot?: boolean          // punto de notificación
  size?: number          // tamaño del icono en px
}

export function IconButton({
  icon,
  label,
  ghost = false,
  dot = false,
  size = 18,
  className,
  ...rest
}: IconButtonProps) {
  const cls = ['icon-btn', ghost ? 'ghost' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type="button" className={cls} aria-label={label} {...rest}>
      <Icon name={icon} size={size} />
      {dot && <span className="dot" aria-hidden="true" />}
    </button>
  )
}
