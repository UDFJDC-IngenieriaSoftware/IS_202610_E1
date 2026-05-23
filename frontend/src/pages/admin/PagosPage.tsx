/**
 * PagosPage — /admin/pagos
 *
 * Historial de cobros PSE con filtros por estado y búsqueda.
 */
import { useState, useMemo, useCallback, memo } from 'react'
import { Topbar }       from '../../components/organisms/Topbar'
import { Card }         from '../../components/organisms/Card'
import { Stat }         from '../../components/molecules/Stat'
import { Icon }         from '../../components/atoms/Icon'
import { IconButton }   from '../../components/atoms/IconButton'
import { SearchInput }  from '../../components/molecules/SearchInput'
import { usePagos }     from '../../hooks/usePagos'
import { useDebounce }  from '../../hooks/useDebounce'
import { fmtCOP, initials } from '../../utils/format'
import { PLANES_MOCK }      from '../../services/mocks/planes.mock'
import { ESTADO_PAGO_META } from '../../types/estados'
import type { Pago, EstadoPago } from '../../types'

/* ── Helpers ─────────────────────────────────────────────────────────── */
function planNombre(id: string) {
  return PLANES_MOCK.find((p) => p.id === id)?.nombre ?? id
}

/* ── Fila memoizada ──────────────────────────────────────────────────── */
const PagoRow = memo(function PagoRow({ pago }: { pago: Pago }) {
  const meta = ESTADO_PAGO_META[pago.estado]
  return (
    <tr>
      <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{pago.fecha}</td>
      <td>
        <div className="barb-cell">
          <div className="barb-avatar">{initials(pago.barbero)}</div>
          <div>
            <div className="barb-name">{pago.barbero}</div>
          </div>
        </div>
      </td>
      <td>
        <span className="plan-chip" data-plan={pago.plan}>
          {planNombre(pago.plan)}
        </span>
      </td>
      <td style={{ fontSize: 12 }}>{pago.metodo}</td>
      <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
        {pago.referencia.slice(-12)}
      </td>
      <td className="num strong">{fmtCOP(pago.monto)}</td>
      <td>
        <span
          className="pill"
          style={{ background: meta.bg, color: meta.fg, borderColor: meta.bd }}
        >
          <span className="pill-dot" style={{ background: meta.fg }} />
          {meta.label}
        </span>
      </td>
      {pago.estado === 'fallido' && (
        <td>
          <button className="btn ghost-sm" type="button">
            Reintentar
          </button>
        </td>
      )}
      {pago.estado !== 'fallido' && <td />}
    </tr>
  )
})

/* ── Filtros ─────────────────────────────────────────────────────────── */
const ESTADOS_PAGO: { key: EstadoPago | 'todos'; label: string }[] = [
  { key: 'todos',     label: 'Todos'     },
  { key: 'exitoso',   label: 'Exitosos'  },
  { key: 'fallido',   label: 'Fallidos'  },
  { key: 'pendiente', label: 'Pendientes'},
]

const PAGE_SIZE = 20

/* ── Componente principal ────────────────────────────────────────────── */
export function PagosPage() {
  const { data: pagos, loading } = usePagos()

  const [busqueda,   setBusqueda]   = useState('')
  const [filtroEst,  setFiltroEst]  = useState<EstadoPago | 'todos'>('todos')
  const [pagina,     setPagina]     = useState(1)

  const debouncedQ = useDebounce(busqueda, 250)

  const handleEstado   = useCallback((k: EstadoPago | 'todos') => { setFiltroEst(k); setPagina(1) }, [])
  const handleBusqueda = useCallback((v: string) => { setBusqueda(v); setPagina(1) }, [])

  /* Stats */
  const stats = useMemo(() => {
    const all = pagos ?? []
    const exitosos  = all.filter((p) => p.estado === 'exitoso')
    const fallidos  = all.filter((p) => p.estado === 'fallido')
    const cobrado   = exitosos.reduce((s, p) => s + p.monto, 0)
    const tasaExito = all.length > 0 ? Math.round((exitosos.length / all.length) * 100) : 0
    return { cobrado, fallidos: fallidos.length, tasaExito }
  }, [pagos])

  /* Filtrado */
  const filtrados = useMemo(() => {
    if (!pagos) return []
    let lista = [...pagos]
    if (filtroEst !== 'todos') lista = lista.filter((p) => p.estado === filtroEst)
    const q = debouncedQ.trim().toLowerCase()
    if (q) lista = lista.filter((p) =>
      (p.barbero + ' ' + p.referencia).toLowerCase().includes(q),
    )
    // Más recientes primero
    return lista.sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [pagos, filtroEst, debouncedQ])

  const totalPaginas  = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const pagePagos     = useMemo(
    () => filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE),
    [filtrados, pagina],
  )

  return (
    <div className="page">
      <Topbar
        title="Pagos"
        subtitle="Historial de cobros PSE · plataforma"
        actions={
          <button className="btn ghost" type="button">
            <Icon name="download" size={15} /> Exportar CSV
          </button>
        }
      />

      <div className="page-body">
        {/* KPIs */}
        <div className="stat-row stat-row--3">
          <Stat
            label="Cobrado este mes"
            value={fmtCOP(stats.cobrado)}
            sub={`${(pagos ?? []).filter((p) => p.estado === 'exitoso').length} transacciones exitosas`}
            trend="up"
            trendLabel="+8% vs. mes anterior"
          />
          <Stat
            label="Pagos fallidos"
            value={String(stats.fallidos)}
            sub="Requieren reintento o acción"
            trend={stats.fallidos > 0 ? 'down' : 'flat'}
            trendLabel={stats.fallidos > 0 ? 'Atención requerida' : 'Sin pendientes'}
          />
          <Stat
            label="Tasa de éxito PSE"
            value={`${stats.tasaExito}%`}
            sub="Del total de intentos de cobro"
            trend="up"
            trendLabel="+2pp vs. mes pasado"
          />
        </div>

        <Card flush>
          {/* Barra de filtros */}
          <div className="filters-bar">
            <SearchInput
              value={busqueda}
              onChange={handleBusqueda}
              placeholder="Buscar barbero o referencia…"
              inline
            />
            <div className="seg" role="group" aria-label="Filtrar por estado de pago">
              {ESTADOS_PAGO.map(({ key, label }) => (
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
            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
              {filtrados.length} transacciones
            </div>
          </div>

          {/* Tabla */}
          {loading && !pagos ? (
            <p style={{ padding: 32, color: 'var(--muted)' }} aria-live="polite">Cargando…</p>
          ) : (
            <>
              <table className="table" aria-label="Historial de pagos PSE">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Barbero</th>
                    <th>Plan</th>
                    <th>Método</th>
                    <th>Referencia</th>
                    <th className="num">Monto</th>
                    <th>Estado</th>
                    <th aria-hidden="true" />
                  </tr>
                </thead>
                <tbody>
                  {pagePagos.map((p) => (
                    <PagoRow key={p.id} pago={p} />
                  ))}
                  {pagePagos.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}
                      >
                        No hay pagos con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="table-foot">
                <span className="muted">
                  Mostrando {pagePagos.length} de {filtrados.length} transacciones
                </span>
                {totalPaginas > 1 && (
                  <nav className="pager" aria-label="Páginas de pagos">
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
    </div>
  )
}
