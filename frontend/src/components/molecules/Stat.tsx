/**
 * Molécula Stat — tarjeta de métrica con valor grande, label y tendencia.
 */
import { memo } from 'react'
import { Icon } from '../atoms/Icon'
import type { IconName } from '../../types/icons'

type Trend = 'up' | 'down' | 'flat'

interface StatProps {
  label: string
  value: string
  sub?: string
  trend?: Trend
  trendLabel?: string
  accent?: boolean
  trendIcon?: IconName
}

const TREND_ICON: Record<Trend, IconName> = {
  up:   'trending_up',
  down: 'trending_down',
  flat: 'trending_flat',
}

export const Stat = memo(function Stat({
  label,
  value,
  sub,
  trend,
  trendLabel,
  accent = false,
}: StatProps) {
  return (
    <div className={`stat${accent ? ' stat--accent' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-big">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
      {trend && trendLabel && (
        <span className={`stat-trend stat-trend--${trend}`}>
          <Icon name={TREND_ICON[trend]} size={14} />
          {trendLabel}
        </span>
      )}
    </div>
  )
})
