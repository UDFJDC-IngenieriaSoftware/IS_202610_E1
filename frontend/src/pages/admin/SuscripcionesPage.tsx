/**
 * SuscripcionesPage — /admin/suscripciones
 *
 * Renovaciones próximas, trials activos y cuentas en mora.
 */
import { useState, useMemo, useCallback, memo } from 'react'
import { Topbar }       from '../../components/organisms/Topbar'
import { Card }         from '../../components/organisms/Card'
import { BarberoModal } from '../../components/organisms/BarberoModal'
import { Stat }         from '../../components/molecules/Stat'
import { Icon }         from '../../components/atoms/Icon'
import { useBarberos }  from '../../hooks/useBarberos'
import { usePagos }     from '../../hooks/usePagos'
import { fmtCOP, initials } from '../../utils/format'
import { PLANES_MOCK }      from '../../services/mocks/planes.mock'
import type { Barbero }     from '../../types'

function planNombre(id: string) {
  return PLANES_MOCK.find((p) => p.id === id)?.nombre ?? id
}

/* ── Fila de renovación memoizada ────────────────────────────────────── */
const RenovRow = memo(function RenovRow({
  barbero, onOpen,
}: { barbero: Barbero; onOpen: (b: Barbero) => void }) {
  const plan = PLANES_MOCK.find((p) => p.id === barbero.plan)!
  return (
    <tr className="row--clickable" onClick={() => onOpen(barbero)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(barbero)}>
      <td>
        <div className="barb-cell">
          <div className="barb-avatar">{initials(barbero.nombre)}</div>
          <div>
            <div className="barb-name">{barbero.nombre}</div>
            <div className="barb-meta">{barbero.barberia}</div>
          </div>
        </div>
      </td>
      <td>
        <span className="plan-chip" data-plan={barbero.plan}>{plan.nombre}</span>
      </td>
      <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{barbero.proxCobro}</td>
      <td className="num strong">{fmtCOP(barbero.mrr)}</td>
      <td><Icon name="chevron_right" size={14} /></td>
    </tr>
  )
})

export function SuscripcionesPage() {
  const { data: barberos } = useBarberos()
  const { data: pagos }    = usePagos()
  const [barberoOpen, setBarberoOpen] = useState<Barbero | null>(null)

  const onOpen  = useCallback((b: Barbero) => setBarberoOpen(b), [])
  const onClose = useCallback(() => setBarberoOpen(null), [])

  const renovaciones = useMemo(
    () =>
      (barberos ?? [])
        .filter((b) => b.estado === 'activa' && b.proxCobro !== '—')
        .sort((a, b) => a.proxCobro.localeCompare(b.proxCobro))
        .slice(0, 8),
    [barberos],
  )

  const trials = useMemo(
    () => (barberos ?? []).filter((b) => b.estado === 'trial'),
    [barberos],
  )
  const morosos = useMemo(
    () => (barberos ?? []).filter((b) => b.estado === 'morosa'),
    [barberos],
  )

  const mrrEsperado = useMemo(
    () => renovaciones.reduce((s, b) => s + b.mrr, 0),
    [renovaciones],
  )

  return (
    <div className="page">
      <Topbar
        title="Suscripciones"
        subtitle="Renovaciones, cambios de plan y trials que vencen pronto"
      />

      <div className="page-body">
        <div className="stat-row stat-row--3">
          <Stat
            label="Renovaciones esta semana"
            value={String(renovaciones.length)}
            sub={`${fmtCOP(mrrEsperado)} esperados`}
          />
          <Stat
            label="Trials que vencen"
            value={String(trials.length)}
            sub={trials.map((b) => b.nombre.split(' ')[0]).join(' · ')}
            trend="flat"
            trendLabel="Faltan < 14 días"
          />
          <Stat
            label="Tasa de renovación"
            value="94%"
            sub="12 de 13 últimas renovaron"
            trend="up"
            trendLabel="+2pp vs. mes pasado"
          />
        </div>

        <div className="grid-2col grid-2col--wide">
          {/* Próximas renovaciones */}
          <Card title="Próximas renovaciones" flush>
            <table className="table" aria-label="Próximas renovaciones de suscripción">
              <thead>
                <tr>
                  <th>Barbero</th>
                  <th>Plan</th>
                  <th>Fecha</th>
                  <th className="num">Monto</th>
                  <th aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {renovaciones.map((b) => (
                  <RenovRow key={b.id} barbero={b} onOpen={onOpen} />
                ))}
              </tbody>
            </table>
          </Card>

          <div className="stack">
            {/* Trials activos */}
            <Card title="Trials activos" flush>
              <ul className="feed" aria-label="Barberos en periodo de prueba">
                {trials.map((b) => (
                  <li
                    key={b.id}
                    className="feed-item"
                    onClick={() => onOpen(b)}
                    style={{ cursor: 'pointer' }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onOpen(b)}
                  >
                    <div className="feed-icon signup">{initials(b.nombre)}</div>
                    <div>
                      <div className="feed-title"><strong>{b.nombre}</strong></div>
                      <div className="feed-sub">{b.barberia} · prueba hasta {b.proxCobro}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="plan-chip" data-plan={b.plan}>{planNombre(b.plan)}</span>
                      <div className="feed-time" style={{ marginTop: 4 }}>Uso {b.uso}%</div>
                    </div>
                  </li>
                ))}
                {trials.length === 0 && (
                  <li style={{ padding: '16px 20px', color: 'var(--muted)', fontSize: 13 }}>
                    No hay trials activos.
                  </li>
                )}
              </ul>
            </Card>

            {/* Cuentas en mora */}
            <Card title="Cuentas en mora" flush>
              <ul className="feed" aria-label="Barberos con cobros pendientes">
                {morosos.map((b) => (
                  <li
                    key={b.id}
                    className="feed-item"
                    onClick={() => onOpen(b)}
                    style={{ cursor: 'pointer' }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onOpen(b)}
                  >
                    <div className="feed-icon churn">
                      <Icon name="warning" size={14} />
                    </div>
                    <div>
                      <div className="feed-title"><strong>{b.nombre}</strong></div>
                      <div className="feed-sub">{b.barberia} · cobro fallido {b.proxCobro}</div>
                    </div>
                    <button
                      className="btn ghost-sm"
                      type="button"
                      onClick={(e) => { e.stopPropagation() }}
                    >
                      Reintentar
                    </button>
                  </li>
                ))}
                {morosos.length === 0 && (
                  <li style={{ padding: '16px 20px', color: 'var(--muted)', fontSize: 13 }}>
                    Sin cuentas en mora.
                  </li>
                )}
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {barberoOpen && (
        <BarberoModal barbero={barberoOpen} pagos={pagos ?? []} onClose={onClose} />
      )}
    </div>
  )
}
