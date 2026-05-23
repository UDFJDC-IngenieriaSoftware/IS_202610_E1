/**
 * Organismo BarberoModal — detalle de barbero con historial de pagos (admin).
 * TODO(step-10): integrar focus-trap y transición.
 */
import { useMemo } from 'react'
import { Modal }       from './Modal'
import { StatusPill }  from '../atoms/StatusPill'
import { Icon }        from '../atoms/Icon'
import { fmtCOP, initials } from '../../utils/format'
import { PLANES_MOCK }      from '../../services/mocks/planes.mock'
import { ESTADO_PAGO_META } from '../../types/estados'
import type { Barbero, Pago } from '../../types'

interface BarberoModalProps {
  barbero: Barbero
  pagos:   ReadonlyArray<Pago>
  onClose: () => void
}

const HOY_REF = new Date('2026-05-18T12:00:00')

function planById(id: string) {
  return PLANES_MOCK.find((p) => p.id === id)!
}

export function BarberoModal({ barbero, pagos, onClose }: BarberoModalProps) {
  const plan      = planById(barbero.plan)
  const pagosBarb = useMemo(
    () => pagos.filter((p) => p.barberoId === barbero.id),
    [pagos, barbero.id],
  )
  const totalPagado = pagosBarb
    .filter((p) => p.estado === 'exitoso')
    .reduce((s, p) => s + p.monto, 0)
  const meses = Math.max(
    1,
    Math.ceil(
      (HOY_REF.getTime() - new Date(barbero.alta + 'T12:00:00').getTime()) /
        (1000 * 60 * 60 * 24 * 30),
    ),
  )
  const iniciales = initials(barbero.nombre)

  return (
    <Modal title="Detalle de barbero" onClose={onClose} maxW={600}>
      {/* Cabecera */}
      <div className="bm-head">
        <div className="bm-avatar-lg">{iniciales}</div>
        <div style={{ flex: 1 }}>
          <div className="bm-id-name">{barbero.nombre}</div>
          <div className="bm-id-meta">
            {barbero.barberia} · {barbero.ciudad} · alta {barbero.alta}
          </div>
        </div>
        <StatusPill estado={barbero.estado} tipo="suscripcion" />
      </div>

      {/* Stats */}
      <div className="bm-stats">
        <div className="bm-stat">
          <div className="bm-stat-label">Plan actual</div>
          <div className="bm-stat-big">{plan.nombre}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            {fmtCOP(plan.precio)}/mes
          </div>
        </div>
        <div className="bm-stat">
          <div className="bm-stat-label">Total pagado</div>
          <div className="bm-stat-big">{fmtCOP(totalPagado)}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            {meses} meses como cliente
          </div>
        </div>
        <div className="bm-stat">
          <div className="bm-stat-label">Próximo cobro</div>
          <div className="bm-stat-big" style={{ fontSize: 18 }}>{barbero.proxCobro}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            {barbero.mrr ? `${fmtCOP(barbero.mrr)} PSE` : '—'}
          </div>
        </div>
      </div>

      {/* Uso del mes */}
      <div className="bm-section">
        <div className="bm-section-label">Uso del mes</div>
        <div style={{
          background: 'var(--surface-2)', borderRadius: 8,
          padding: 12, border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span>Citas agendadas</span>
            <strong>
              {barbero.citasMes}
              {barbero.citasMaximo ? ` / ${barbero.citasMaximo}` : ' (ilimitadas)'}
            </strong>
          </div>
          <div className="usage-bar" style={{ width: '100%', height: 8 }}>
            <div
              className={`usage-fill${barbero.uso > 85 ? ' hi' : barbero.uso > 60 ? ' mid' : ''}`}
              style={{ width: `${barbero.uso}%` }}
            />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
            Última actividad: {barbero.lastSeen}
          </div>
        </div>
      </div>

      {/* Historial de pagos */}
      <div className="bm-section">
        <div className="bm-section-label">Historial de pagos</div>
        <div className="bm-pay-list" style={{
          background: 'var(--surface-2)', borderRadius: 8,
          padding: '0 14px', border: '1px solid var(--border)',
        }}>
          {pagosBarb.length === 0 && (
            <div style={{ padding: '12px 0', fontSize: 12, color: 'var(--muted)' }}>
              Sin pagos registrados (cuenta en prueba).
            </div>
          )}
          {pagosBarb.slice(0, 5).map((p) => {
            const meta = ESTADO_PAGO_META[p.estado]
            return (
              <div key={p.id} className="bm-pay-row">
                <div className="bm-pay-date">{p.fecha}</div>
                <div>
                  <div style={{ fontSize: 13 }}>Plan {planById(p.plan).nombre}</div>
                  <div className="bm-pay-ref">{p.metodo} · {p.referencia}</div>
                </div>
                <div className="bm-pay-monto">{fmtCOP(p.monto)}</div>
                <span
                  className="pill"
                  style={{ background: meta.bg, color: meta.fg, borderColor: meta.bd }}
                >
                  <span className="pill-dot" style={{ background: meta.fg }} />
                  {meta.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Acciones */}
      <div className="modal-foot modal-foot--3">
        <button className="btn ghost" type="button">
          <Icon name="whatsapp" size={15} /> WhatsApp
        </button>
        <button className="btn ghost" type="button">
          <Icon name="edit" size={15} /> Cambiar plan
        </button>
        <button className="btn primary" type="button" onClick={onClose}>
          Ver panel del barbero
        </button>
      </div>
    </Modal>
  )
}
