/**
 * AdminDashboardPage — /admin/dashboard
 *
 * KPIs de la plataforma: MRR, barberos, nuevos, churn.
 * Feed de actividad reciente derivado de PAGOS + BARBEROS (useMemo).
 * Performance: componentes FeedItem y MoraBarberoRow con React.memo.
 */
import { useState, useMemo, useCallback, memo } from 'react'
import { useNavigate }   from 'react-router-dom'
import { Topbar }        from '../../components/organisms/Topbar'
import { Card }          from '../../components/organisms/Card'
import { BarberoModal }  from '../../components/organisms/BarberoModal'
import { Icon }          from '../../components/atoms/Icon'
import { useBarberos, useMetricas } from '../../hooks/useBarberos'
import { usePagos }      from '../../hooks/usePagos'
import { fmtCOP, fmtK } from '../../utils/format'
import { PLANES_MOCK }   from '../../services/mocks/planes.mock'
import { ESTADO_SUS_META } from '../../types/estados'
import type { Barbero, Pago } from '../../types'

/* ── Helpers ───────────────────────────────────────────────────────── */
function planNombre(id: string) {
  return PLANES_MOCK.find((p) => p.id === id)?.nombre ?? id
}

/* ── Feed de actividad (derivado de pagos + barberos) ──────────────── */
type FeedType = 'signup' | 'payment' | 'churn' | 'upgrade'

interface FeedEntry {
  id: string
  type: FeedType
  title: string
  sub: string
  time: string
  amount?: string
}

const FEED_ICON: Record<FeedType, string> = {
  signup:  'person',
  payment: 'attach_money',
  churn:   'warning',
  upgrade: 'trending_up',
}

function buildFeed(
  barberos: ReadonlyArray<Barbero>,
  pagos: ReadonlyArray<Pago>,
): FeedEntry[] {
  const entries: FeedEntry[] = []

  // Signups recientes (trial o alta reciente)
  barberos
    .filter((b) => b.estado === 'trial')
    .forEach((b) => {
      entries.push({
        id: `signup-${b.id}`,
        type: 'signup',
        title: `${b.nombre} empezó la prueba gratis`,
        sub: `${b.barberia} · ${b.ciudad} · Plan ${planNombre(b.plan)}`,
        time: b.lastSeen,
      })
    })

  // Cobros en mora
  barberos
    .filter((b) => b.estado === 'morosa')
    .forEach((b) => {
      entries.push({
        id: `churn-${b.id}`,
        type: 'churn',
        title: `${b.nombre} tiene cobro pendiente`,
        sub: `${b.barberia} · ${b.ciudad} · PSE fallido`,
        time: b.lastSeen,
      })
    })

  // Pagos exitosos recientes
  pagos
    .filter((p) => p.estado === 'exitoso')
    .slice(0, 4)
    .forEach((p) => {
      entries.push({
        id: `payment-${p.id}`,
        type: 'payment',
        title: `${p.barbero} renovó Plan ${planNombre(p.plan)}`,
        sub: `${fmtCOP(p.monto)} · ${p.metodo} · ref. ${p.referencia.slice(-8)}`,
        time: p.fecha,
        amount: `+${fmtK(p.monto)}`,
      })
    })

  return entries.slice(0, 8)
}

/* ── FeedItem memoizado ─────────────────────────────────────────────── */
const FeedItem = memo(function FeedItem({ entry }: { entry: FeedEntry }) {
  const iconName = FEED_ICON[entry.type] as 'person' | 'attach_money' | 'warning' | 'trending_up'
  return (
    <li className="feed-item">
      <div className={`feed-icon ${entry.type}`}>
        <Icon name={iconName} size={15} />
      </div>
      <div>
        <div className="feed-title">{entry.title}</div>
        <div className="feed-sub">{entry.sub}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {entry.amount && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--st-green-fg)' }}>
            {entry.amount}
          </div>
        )}
        <div className="feed-time">{entry.time}</div>
      </div>
    </li>
  )
})

/* ── Fila de barbero en mora memoizada ──────────────────────────────── */
const MoraBarberoRow = memo(function MoraBarberoRow({
  barbero,
  onOpen,
}: {
  barbero: Barbero
  onOpen: (b: Barbero) => void
}) {
  const meta = ESTADO_SUS_META['morosa']
  return (
    <li>
      <button type="button" className="cita-row" onClick={() => onOpen(barbero)}
        aria-label={`Ver detalle de ${barbero.nombre}`}>
        <div className="cita-time">
          <div className="cita-hora" style={{ color: meta.fg }}>
            {barbero.proxCobro.slice(8)}d
          </div>
          <div className="cita-dur">mora</div>
        </div>
        <div className="cita-bar" style={{ background: meta.fg }} aria-hidden="true" />
        <div className="cita-info">
          <div className="cita-cliente">{barbero.nombre}</div>
          <div className="cita-servicio">
            {barbero.barberia} · Plan {planNombre(barbero.plan)} · {fmtCOP(barbero.mrr)}
          </div>
        </div>
        <span className="btn ghost-sm">Reintentar PSE</span>
      </button>
    </li>
  )
})

/* ── Componente principal ─────────────────────────────────────────── */
export function AdminDashboardPage() {
  const navigate              = useNavigate()
  const { data: barberos }    = useBarberos()
  const { data: pagos }       = usePagos()
  const { data: metricas }    = useMetricas()
  const [barberoAbierto, setBarberoAbierto] = useState<Barbero | null>(null)

  const onOpenBarbero  = useCallback((b: Barbero) => setBarberoAbierto(b), [])
  const onCloseBarbero = useCallback(() => setBarberoAbierto(null), [])

  /* Conteo por plan */
  const planCounts = useMemo(() => {
    if (!barberos) return { solo: 0, pro: 0, estudio: 0, total: 0 }
    const activos = barberos.filter((b) => b.estado !== 'cancelada')
    return {
      solo:    activos.filter((b) => b.plan === 'solo').length,
      pro:     activos.filter((b) => b.plan === 'pro').length,
      estudio: activos.filter((b) => b.plan === 'estudio').length,
      total:   activos.length,
    }
  }, [barberos])

  const morosos = useMemo(
    () => (barberos ?? []).filter((b) => b.estado === 'morosa'),
    [barberos],
  )

  /* MRR spark max */
  const sparkMax = useMemo(
    () => Math.max(...(metricas?.mrrSerie ?? [1])),
    [metricas],
  )

  /* Feed de actividad */
  const feed = useMemo(
    () => buildFeed(barberos ?? [], pagos ?? []),
    [barberos, pagos],
  )

  /* Signups sparkmax */
  const signupMax = useMemo(
    () => Math.max(...(metricas?.signupsSerie ?? [1])),
    [metricas],
  )
  const totalSignups = useMemo(
    () => (metricas?.signupsSerie ?? []).reduce((s, v) => s + v, 0),
    [metricas],
  )

  return (
    <div className="page">
      <Topbar
        title="Visión general"
        subtitle="Plataforma MiTurno · Admin"
        actions={
          <button className="btn primary" type="button">
            <Icon name="add" size={15} /> Invitar barbero
          </button>
        }
      />

      <div className="page-body">
        {/* ── KPI Row ──────────────────────────────────────────── */}
        <div className="kpi-row">
          {/* Hero: MRR */}
          <div className="kpi-hero">
            <div className="kpi-hero-head">
              <div>
                <div className="kpi-hero-label">MRR · mayo</div>
                <div className="kpi-hero-big">{fmtK(metricas?.mrr ?? 0)}</div>
                <div className="kpi-hero-sub">
                  Ingreso mensual recurrente · {fmtK(metricas?.arr ?? 0)} ARR proyectado
                </div>
              </div>
              <div className="kpi-trend-pill">↑ +6.4% MoM</div>
            </div>
            {/* Spark MRR */}
            <div className="spark" aria-hidden="true">
              {(metricas?.mrrSerie ?? []).map((v, i) => (
                <div
                  key={i}
                  className={`spark-bar${i === (metricas?.mrrSerie.length ?? 0) - 1 ? ' hi' : ''}`}
                  style={{ height: `${(v / sparkMax) * 100}%` }}
                  title={fmtK(v * 1000)}
                />
              ))}
            </div>
            <div className="spark-row" aria-hidden="true">
              {(metricas?.mesesSerie ?? []).map((m, i) => (
                <div key={i} className="spark-label">{m}</div>
              ))}
            </div>
          </div>

          {/* Mini: Barberos */}
          <div className="kpi-mini">
            <div className="kpi-mini-label">Barberos activos</div>
            <div className="kpi-mini-big">{planCounts.total}</div>
            <div className="kpi-mini-sub">
              {metricas?.trial ?? 0} en prueba · {morosos.length} en mora
            </div>
            <div className="plan-stripe" aria-hidden="true">
              {planCounts.total > 0 && (
                <>
                  <div className="ps-seg" style={{ background: 'var(--st-slate-fg)', width: `${(planCounts.solo / planCounts.total) * 100}%` }} />
                  <div className="ps-seg" style={{ background: 'var(--accent)',       width: `${(planCounts.pro  / planCounts.total) * 100}%` }} />
                  <div className="ps-seg" style={{ background: 'var(--ink)',          width: `${(planCounts.estudio / planCounts.total) * 100}%` }} />
                </>
              )}
            </div>
            <div className="plan-legend">
              <div className="plan-legend-item">
                <span className="plan-legend-dot" style={{ background: 'var(--st-slate-fg)' }} />
                Solo · {planCounts.solo}
              </div>
              <div className="plan-legend-item">
                <span className="plan-legend-dot" style={{ background: 'var(--accent)' }} />
                Pro · {planCounts.pro}
              </div>
              <div className="plan-legend-item">
                <span className="plan-legend-dot" style={{ background: 'var(--ink)' }} />
                Estudio · {planCounts.estudio}
              </div>
            </div>
          </div>

          {/* Mini: Nuevos */}
          <div className="kpi-mini">
            <div className="kpi-mini-label">Nuevos · mayo</div>
            <div className="kpi-mini-big">+{metricas?.nuevosMes ?? 0}</div>
            <div className="kpi-mini-sub">Tasa de conversión {metricas?.conversionPct ?? 0}%</div>
            <div className="kpi-mini-foot">
              <span>Trial → pagado</span>
              <strong>{metricas?.conversionPct ?? 0}%</strong>
            </div>
          </div>

          {/* Mini: Churn */}
          <div className="kpi-mini">
            <div className="kpi-mini-label">Churn</div>
            <div className="kpi-mini-big" style={{ color: 'var(--st-red-fg)' }}>
              {metricas?.churnPct ?? 0}%
            </div>
            <div className="kpi-mini-sub">
              {metricas?.cancelados ?? 0} cancelación este mes
            </div>
            <div className="kpi-mini-foot">
              <span>Vs. abril</span>
              <strong style={{ color: 'var(--st-green-fg)' }}>−1.3 pp</strong>
            </div>
          </div>
        </div>

        {/* ── Grid 2 columnas ──────────────────────────────────── */}
        <div className="grid-2col grid-2col--wide">
          {/* Feed de actividad */}
          <Card
            title="Actividad reciente"
            action={
              <button
                className="btn ghost-sm"
                type="button"
                onClick={() => navigate('/admin/pagos')}
              >
                Ver pagos <Icon name="chevron_right" size={13} />
              </button>
            }
            flush
          >
            <ul className="feed" aria-label="Actividad reciente de la plataforma">
              {feed.map((entry) => (
                <FeedItem key={entry.id} entry={entry} />
              ))}
            </ul>
          </Card>

          {/* Columna derecha */}
          <div className="stack">
            {/* Inscripciones spark */}
            <Card title="Inscripciones · últimos 12 meses">
              <div className="signups-card">
                <div className="signups-bars" aria-hidden="true">
                  {(metricas?.signupsSerie ?? []).map((v, i) => (
                    <div
                      key={i}
                      className={`signups-bar${i >= 9 ? ' hi' : ''}`}
                      style={{ height: `${(v / signupMax) * 100}%` }}
                      title={`${metricas?.mesesSerie[i]}: ${v} nuevos`}
                    />
                  ))}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 32, lineHeight: 1 }}>
                    {totalSignups}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>total año</div>
                </div>
              </div>
              <div className="week-foot" style={{ marginTop: 14 }}>
                <div><span className="muted">Ticket prom.</span> <strong>{fmtCOP(metricas?.ticketProm ?? 0)}</strong></div>
                <div><span className="muted">LTV est.</span> <strong>{fmtCOP((metricas?.ticketProm ?? 0) * 18)}</strong></div>
                <div><span className="muted">Payback</span> <strong>2.4 meses</strong></div>
              </div>
            </Card>

            {/* Cobros en mora */}
            <Card title="Cobros que necesitan atención" flush>
              {morosos.length === 0 ? (
                <p style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  Ningún cobro pendiente. Todo en orden.
                </p>
              ) : (
                <ul className="cita-list" aria-label="Barberos en mora">
                  {morosos.map((b) => (
                    <MoraBarberoRow key={b.id} barbero={b} onOpen={onOpenBarbero} />
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>

      {barberoAbierto && (
        <BarberoModal
          barbero={barberoAbierto}
          pagos={pagos ?? []}
          onClose={onCloseBarbero}
        />
      )}
    </div>
  )
}
