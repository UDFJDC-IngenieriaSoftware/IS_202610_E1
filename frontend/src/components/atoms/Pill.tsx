/**
 * Átomo Pill — etiqueta genérica con color controlado por CSS vars.
 */
interface PillProps {
  label: string
  /** Color del punto y del texto (CSS var o valor) */
  color: string
  /** Color de fondo (CSS var o valor) */
  bg: string
  /** Color del borde (CSS var o valor) */
  border: string
  className?: string
}

export function Pill({ label, color, bg, border, className }: PillProps) {
  return (
    <span
      className={`pill${className ? ` ${className}` : ''}`}
      style={{ background: bg, borderColor: border, color }}
    >
      <span className="pill-dot" style={{ background: color }} />
      {label}
    </span>
  )
}
