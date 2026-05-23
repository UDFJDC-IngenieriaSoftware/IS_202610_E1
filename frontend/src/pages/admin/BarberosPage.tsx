/**
 * BarberosPage — /admin/barberos
 *
 * Tabla de barberos con filtros por estado, plan y búsqueda (debounced).
 * Performance: BarberoRow con React.memo, filtros con useMemo.
 */
import { useState, useMemo, useCallback, memo } from 'react'
import { Topbar }        from '../../components/organisms/Topbar'
import { Card }          from '../../components/organisms/Card'
import { BarberoModal }  from '../../components/organisms/BarberoModal'
import { StatusPill }    from '../../components/atoms/StatusPill'
import { Icon }          from '../../components/atoms/Icon'
import { IconButton }    from '../../components/atoms/IconButton'
import { SearchInput }   from '../../components/molecules/SearchInput'
import { useBarberos }   from '../../hooks/useBarberos'
import { usePagos }      from '../../hooks/usePagos'
import { useDebounce }   from '../../hooks/useDebounce'
import { fmtCOP, initials } from '../../utils/format'
import { PLANES_MOCK }      from '../../services/mocks/planes.mock'
import type { Barbero, EstadoSuscripcion, PlanId } from '../../types'

/* ── Helpers ────────────────────────────────────────────────────────── */
function planNombre(id: string) {
  return PLANES_MOCK.find((p) => p.id === id)?.nombre ?? id
}

/* ── Fila memoizada ─────────────────────────────────────────────────── */
const BarberoRow = memo(function BarberoRow({
  barbero,
  onOpen,
}: {
  barbero: Barbero
  onOpen:  (b: Barbero) => void
}) {
  return (
    <tr className="row--clickable" onClick={() => onOpen(barbero)}>
      <td>
        <div className="barb-cell">
          <div className="barb-avatar">{initials(barbero.nombre)}</div>
          <div>
            <div className="barb-name">{barbero.nombre}</div>
            <div className="barb-meta">{barbero.barberia} · {barbero.ciudad}</div>
          </div>
        </div>
      </td>
      <td>
        <span className="plan-chip" data-plan={barbero.plan}>
          {planNombre(barbero.plan)}
        </span>
      </td>
      <td><StatusPill estado={barbero.estado} tipo="suscripcion" /></td>
      <td className="num strong">
        {barbero.mrr ? fmtCOP(barbero.mrr) : '—'}
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="usage-bar">
            <div
              className={`usage-fill${barbero.uso > 85 ? ' hi' : barbero.uso > 60 ? ' mid' : ''}`}
              style={{ width: `${barbero.uso}%` }}
            />
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
            {barbero.citasMes}{barbero.citasMaximo ? `/${barbero.citasMaximo}` : ''}
          </span>
        </div>
      </td>
      <td className="num" style={{ fontSize: 12 }}>{barbero.proxCobro}</td>
      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{barbero.lastSeen}</td>
      <td><Icon name="chevron_right" size={14} /></td>
    </tr>
  )
})

/* ── Filtros ────────────────────────────────────────────────────────── */
const ESTADOS: { key: EstadoSuscripcion | 'todos'; label: string }[] = [
  { key: 'todos',     label: 'Todos'       },
  { key: 'activa',    label: 'Activos'     },
  { key: 'trial',     label: 'En prueba'   },
  { key: 'morosa',    label: 'En mora'     },
  { key: 'cancelada', label: 'Cancelados'  },
]
const PLANES_FILTRO: { key: PlanId | 'todos'; label: string }[] = [
  { key: 'todos',    label: 'Todos los planes' },
  { key: 'solo',     label: 'Solo'             },
  { key: 'pro',      label: 'Pro'              },
  { key: 'estudio',  label: 'Estudio'          },
]

/* ── Componente principal ─────────────────────────────────────────── */
const PAGE_SIZE = 15

export function BarberosPage() {
  const { data: barberos, loading } = useBarberos()
  const { data: pagos }             = usePagos()

  const [busqueda,    setBusqueda]    = useState('')
  const [filtroEst,   setFiltroEst]   = useState<EstadoSuscripcion | 'todos'>('todos')
  const [filtroPlan,  setFiltroPlan]  = useState<PlanId | 'todos'>('todos')
  const [pagina,      setPagina]      = useState(1)
  const [barberoOpen, setBarberoOpen] = useState<Barbero | null>(null)

  const debouncedQ = useDebounce(busqueda, 250)

  const onOpenBarbero  = useCallback((b: Barbero) => setBarberoOpen(b), [])
  const onCloseBarbero = useCallback(() => setBarberoOpen(null), [])

  /* Filtrado memoizado */
  const filtrados = useMemo(() => {
    if (!barberos) return []
    let lista = [...barberos]
    if (filtroEst  !== 'todos') lista = lista.filter((b) => b.estado === filtroEst)
    if (filtroPlan !== 'todos') lista = lista.filter((b) => b.plan   === filtroPlan)
    const q = debouncedQ.trim().toLowerCase()
    if (q) lista = lista.filter((b) =>
      (b.nombre + ' ' + b.barberia).toLowerCase().includes(q),
    )
    return lista
  }, [barberos, filtroEst, filtroPlan, debouncedQ])

  const mrrFiltrado = useMemo(
    () => filtrados.reduce((s, b) => s + b.mrr, 0),
    [filtrados],
  )

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const pageBarberos = useMemo(
    () => filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE),
    [filtrados, pagina],
  )

  function handleEstado(k: EstadoSuscripcion | 'todos') { setFiltroEst(k);  setPagina(1) }
  function handlePlan(k: PlanId | 'todos')               { setFiltroPlan(k); setPagina(1) }
  function handleBusqueda(v: string)                     { setBusqueda(v);   setPagina(1) }

  return (
    <div className="page">
      <Topbar
        title="Barberos suscritos"
        subtitle={`${barberos?.length ?? 0} cuentas · ${barberos?.filter((b) => b.estado === 'activa').length ?? 0} activas`}
        actions={
          <>
            <button className="btn ghost" type="button">
              <Icon name="download" size={15} /> Exportar CSV
            </button>
            <button className="btn primary" type="button">
              <Icon name="add" size={15} /> Invitar barbero
            </button>
          </>
        }
      />

      <div className="page-body">
        <Card flush>
          {/* Barra de filtros */}
          <div className="filters-bar">
            <SearchInput
              value={busqueda}
              onChange={handleBusqueda}
              placeholder="Buscar nombre o barbería…"
              inline
            />
            <div className="seg" role="group" aria-label="Filtrar por estado">
              {ESTADOS.map(({ key, label }) => (
                <button
                  key={key}
                  className={filtroEst === key ? 'is-on' : ''}
                  onClick={() => handleEstado(key)}
                  aria-pressed={filtroEst === key}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="seg" role="group" aria-label="Filtrar por plan">
              {PLANES_FILTRO.map(({ key, label }) => (
                <button
                  key={key}
                  className={filtroPlan === key ? 'is-on' : ''}
                  onClick={() => handlePlan(key)}
                  aria-pressed={filtroPlan === key}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
              MRR filtrado:{' '}
              <strong style={{ color: 'var(--ink)' }}>{fmtCOP(mrrFiltrado)}</strong>
            </div>
          </div>

          {/* Tabla */}
          {loading && !barberos ? (
            <p style={{ padding: 32, color: 'var(--muted)' }} aria-live="polite">Cargando…</p>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Barbero</th>
                    <th>Plan</th>
                    <th>Estado</th>
                    <th className="num">MRR</th>
                    <th>Uso del mes</th>
                    <th>Próx. cobro</th>
                    <th>Última actividad</th>
                    <th aria-hidden="true" />
                  </tr>
                </thead>
                <tbody>
                  {pageBarberos.map((b) => (
                    <BarberoRow key={b.id} barbero={b} onOpen={onOpenBarbero} />
                  ))}
                  {pageBarberos.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                        No hay barberos con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="table-foot">
                <span className="muted">
                  Mostrando {pageBarberos.length} de {filtrados.length} barberos
                </span>
                {totalPaginas > 1 && (
                  <nav className="pager" aria-label="Páginas de barberos">
                    <IconButton
                      icon="chevron_left"
                      label="Anterior"
                      onClick={() => setPagina((p) => Math.max(1, p - 1))}
                      disabled={pagina === 1}
                    />
                    <span>{pagina} / {totalPaginas}</span>
                    <IconButton
                      icon="chevron_right"
                      label="Siguiente"
                      onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                      disabled={pagina === totalPaginas}
                    />
                  </nav>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      {barberoOpen && (
        <BarberoModal
          barbero={barberoOpen}
          pagos={pagos ?? []}
          onClose={onCloseBarbero}
        />
      )}
    </div>
  )
}
