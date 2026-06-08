/**
 * Átomo Icon — renderiza un icono de Material Symbols (Rounded).
 * Usa la fuente de icono ligera vía ligatura de texto.
 * La fuente debe estar cargada en el <head> o en base.css.
 */
import type { IconName } from '../../types/icons'

interface IconProps {
  name: IconName
  /** Tamaño en px (también afecta el optical-size). Por defecto 20. */
  size?: number
  /** Clase CSS adicional */
  className?: string
  /** aria-label para iconos que actúan solos como botón */
  label?: string
}

export function Icon({ name, size = 20, className, label }: IconProps) {
  return (
    <span
      className={`material-symbols-rounded${className ? ` ${className}` : ''}`}
      style={{
        fontSize: size,
        lineHeight: 1,
        userSelect: 'none',
        fontVariationSettings: `'opsz' ${size}`,
        display: 'inline-flex',
        alignItems: 'center',
      }}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {name}
    </span>
  )
}
