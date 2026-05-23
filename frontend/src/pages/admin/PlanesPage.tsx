/**
 * PlanesPage — /admin/planes
 *
 * Gestión de planes SaaS: precio, límites, funcionalidades y métricas por plan.
 */
import { useMemo, memo } from 'react'
import { Topbar }       from '../../components/organisms/Topbar'
import { Card }         from '../../components/organisms/Card'
import { Stat }         from '../../components/molecules/Stat'
import { Icon }         from '../../components/atoms/Icon'
import { useBarberos }  from '../../hooks/useBarberos'
import { fmtCOP }       from '../../utils/format'
import { PLANES_MOCK }  from '../../services/mocks/planes.mock'
import type { Plan, Barbero } from '../../types'

/* ── Tarjeta de plan memoizada ───────────────────────────────────────── */
const PlanCard = memo(function PlanCard({
  plan,
  barberos,
}: {
  plan: Plan
  barberos: ReadonlyArray<Barbero>
}) {
  const activos = barberos.filter(
    (b) => b.plan === plan.id && b.estado !== 'cancelada',
  )
  const mrr = activos.reduce((s, b) => s + b.mrr, 0)

  return (
    <div className="plan-mgmt" data-plan={plan.id}>
      <div className="plan-mgmt-head">
        <div>
          <div className="plan-mgmt-name">{plan.nombre}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {plan.limites}
          </div>
        </div>
        <div className="plan-mgmt-mrr-pill" style={{ background: plan.color }}>
          {fmtCOP(mrr)}/mes
        </div>
      </div>

      <div className="plan-mgmt-price">
        <span style={{ fontFamily: 'var(--serif)', fontSize: 36, lineHeight: 1 }}>
          {fmtCOP(plan.precio)}
        </span>
        <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 4 }}>/mes</span>
      </div>

      <div className="plan-mgmt-stats">
        <div className="plan-mgmt-stat">
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{activos.length}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>suscritos</div>
        </div>
        <div className="plan-mgmt-stat">
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{fmtCOP(mrr)}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>MRR</div>
        </div>
        <div className="plan-mgmt-stat">
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>
            {activos.length > 0
              ? Math.round(activos.reduce((s, b) => s + b.uso, 0) / activos.length)
              : 0}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>uso prom.</div>
        </div>
      </div>

      <ul className="plan-mgmt-features">
        {plan.features.map((f) => (
          <li key={f} className="plan-mgmt-feat">
            <Icon name="check_circle" size={14} />
            {f}
          </li>
        ))}
      </ul>

      <div className="plan-mgmt-actions">
        <button className="btn ghost" type="button">
          <Icon name="edit" size={14} /> Editar plan
        </button>
        <button className="btn primary" type="button">
          Ver suscritos
        </button>
      </div>
    </div>
  )
})

/* ── Fila de distribución de ingresos ────────────────────────────────── */
const RevenueBar = memo(function RevenueBar({
  plan,
  mrrPlan,
  mrrTotal,
}: {
  plan: Plan
  mrrPlan: number
  mrrTotal: number
}) {
  const pct = mrrTotal > 0 ? Math.round((mrrPlan / mrrTotal) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 64, fontSize: 12, fontWeight: 500 }}>{plan.nombre}</div>
      <div className="usage-bar" style={{ flex: 1 }}>
        <div
          className="usage-fill"
          style={{ width: `${pct}%`, background: plan.color }}
        />
      </div>
      <div style={{ width: 80, textAlign: 'right', fontSize: 12 }}>
        {fmtCOP(mrrPlan)}
      </div>
      <div
        style={{
          width: 40,
          textAlign: 'right',
          fontSize: 12,
          fontFamily: 'var(--mono)',
          color: 'var(--muted)',
        }}
      >
        {pct}%
      </div>
    </div>
  )
})

/* ── Componente principal ────────────────────────────────────────────── */
export function PlanesPage() {
  const { data: barberos } = useBarberos()

  const planStats = useMemo(() => {
    const b = barberos ?? []
    return PLANES_MOCK.map((plan) => {
      const activos = b.filter(
        (bb) => bb.plan === plan.id && bb.estado !== 'cancelada',
      )
      return {
        plan,
        activos: activos.length,
        mrr: activos.reduce((s, bb) => s + bb.mrr, 0),
      }
    })
  }, [barberos])

  const mrrTotal = useMemo(
    () => planStats.reduce((s, ps) => s + ps.mrr, 0),
    [planStats],
  )

  const totalActivos = useMemo(
    () => planStats.reduce((s, ps) => s + ps.activos, 0),
    [planStats],
  )

  return (
    <div className="page">
      <Topbar
        title="Planes"
        subtitle="Configuración de planes SaaS y distribución de ingresos"
        actions={
          <button className="btn primary" type="button">
            <Icon name="add" size={15} /> Nuevo plan
          </button>
        }
      />

      <div className="page-body">
        {/* Stats resumen */}
        <div className="stat-row stat-row--3">
          <Stat
            label="MRR total activo"
            value={fmtCOP(mrrTotal)}
            sub={`${totalActivos} suscritos activos`}
            trend="up"
            trendLabel="+6.4% vs. mes anterior"
          />
          <Stat
            label="Ticket promedio"
            value={fmtCOP(
              totalActivos > 0 ? Math.round(mrrTotal / totalActivos) : 0,
            )}
            sub="Por barbero activo / mes"
          />
          <Stat
            label="LTV estimado"
            value={fmtCOP(
              totalActivos > 0
                ? Math.round((mrrTotal / totalActivos) * 18)
                : 0,
            )}
            sub="Basado en 18 meses promedio"
          />
        </div>

        {/* Tarjetas de planes */}
        <div className="plan-mgmt-grid">
          {PLANES_MOCK.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              barberos={barberos ?? []}
            />
          ))}
        </div>

        {/* Distribución de ingresos */}
        <Card title="Distribución de ingresos por plan">
          <div style={{ padding: '4px 0' }}>
            {planStats.map(({ plan, mrr }) => (
              <RevenueBar
                key={plan.id}
                plan={plan}
                mrrPlan={mrr}
                mrrTotal={mrrTotal}
              />
            ))}
          </div>
          <div
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
            }}
          >
            <span style={{ color: 'var(--muted)' }}>Total MRR activo</span>
            <strong>{fmtCOP(mrrTotal)}</strong>
          </div>
        </Card>
      </div>
    </div>
  )
}
