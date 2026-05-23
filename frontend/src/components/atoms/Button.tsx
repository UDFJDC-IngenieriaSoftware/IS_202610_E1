/**
 * Átomo Button — botón semántico con variantes del sistema de diseño.
 */
import type { ReactNode, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'ghost-sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  /** Icono u otro nodo antes del texto */
  leading?: ReactNode
  children?: ReactNode
}

export function Button({
  variant = 'ghost',
  leading,
  children,
  className,
  ...rest
}: ButtonProps) {
  const cls = ['btn', variant, className].filter(Boolean).join(' ')
  return (
    <button type="button" className={cls} {...rest}>
      {leading}
      {children}
    </button>
  )
}
