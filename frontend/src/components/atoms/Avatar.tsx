/**
 * Átomo Avatar — círculo con iniciales del usuario.
 * Variantes de tamaño: sm (28 px), md (34 px), lg (40 px), xl (56 px).
 */
import { initials } from '../../utils/format'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_PX: Record<AvatarSize, number> = {
  sm: 28,
  md: 34,
  lg: 40,
  xl: 56,
}

const FONT_PX: Record<AvatarSize, number> = {
  sm: 10,
  md: 12,
  lg: 13,
  xl: 18,
}

interface AvatarProps {
  nombre: string
  size?: AvatarSize
  className?: string
}

export function Avatar({ nombre, size = 'md', className }: AvatarProps) {
  const px = SIZE_PX[size]
  const fp = FONT_PX[size]
  return (
    <span
      className={`avatar${className ? ` ${className}` : ''}`}
      style={{ width: px, height: px, fontSize: fp }}
      aria-label={nombre}
    >
      {initials(nombre)}
    </span>
  )
}
