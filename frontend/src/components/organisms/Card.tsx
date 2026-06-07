/**
 * Organismo Card — contenedor con cabecera opcional y cuerpo.
 */
import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  /** Título de la tarjeta. Acepta string o nodo ReactNode (ej. filtros). */
  title?: string | ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  /** Si true, elimina el padding del body (flush). */
  flush?: boolean
  /** Estilos inline opcionales para el contenedor. */
  style?: CSSProperties
}

export function Card({ title, action, children, className, flush = false, style }: CardProps) {
  return (
    <section className={`card${className ? ` ${className}` : ''}`} style={style}>
      {(title || action) && (
        <div className="card-head">
          {title && <h2 className="card-title">{title}</h2>}
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className={flush ? 'card-body card-body--flush' : 'card-body'}>
        {children}
      </div>
    </section>
  )
}
