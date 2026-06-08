/**
 * Molécula LegendItem — ítem de leyenda para la agenda (color + label + desc).
 */
import { memo } from 'react'

interface LegendItemProps {
  color: string   // CSS var o valor
  label: string
  desc?: string
}

export const LegendItem = memo(function LegendItem({
  color,
  label,
  desc,
}: LegendItemProps) {
  return (
    <div className="legend-item">
      <span className="legend-dot" style={{ background: color }} />
      <span className="legend-label">{label}</span>
      {desc && <span className="legend-desc">{desc}</span>}
    </div>
  )
})
