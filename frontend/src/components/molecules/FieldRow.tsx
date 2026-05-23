/**
 * Molécula FieldRow — grid de dos columnas para agrupar campos de formulario.
 */
import type { ReactNode } from 'react'

interface FieldRowProps {
  children: ReactNode
}

export function FieldRow({ children }: FieldRowProps) {
  return <div className="field-row">{children}</div>
}
