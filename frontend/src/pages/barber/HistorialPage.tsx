/**
 * HistorialPage — /panel/historial
 *
 * Tabla de citas con filtros combinados:
 *  - Búsqueda por cliente/servicio (debounced 250ms vía useFilteredHistorial)
 *  - Filtro de estado
 *  - Filtro de periodo (mes / semana / año / todo)
 *
 * Performance:
 *  - useFilteredHistorial encapsula useMemo + useDebounce.
 *  - HistorialRow envuelto en React.memo.
 */
import { useState, useMemo, memo, useCallback } from 'react'
import { Topbar }       from '../../components/organisms/Topbar'
import { Card }         from '../../components/organisms/Card'
import { CitaModal }    from '../../components/organisms/CitaModal'
import { Stat }         from '../../components/molecules/Stat'
import { SearchInput }  from '../../components/molecules/SearchInput'
import { StatusPill }   from '../../components/atoms/StatusPill'
import { Icon }         from '../../components/atoms/Icon'
import { IconButton }   from '../../components/atoms/IconButton'
import {
  useFilteredHistorial,
  type FiltroFecha,
} from '../../hooks/useFilteredHistorial'
import { fmtCOP, fmtFechaCorta, initials } from '../../utils/format'
import type { Cita, EstadoCita } from '../../types'

/* ── Fila de tabla memoizada ─────────────────────────────────────── */
const HistorialRow = memo(function HistorialRow({
  cita,
  onOpen,
}: {
  cita: Cita
  onOpen: (c: Cita) => void
}) {
  return (
    <tr className="row--clickable" onClick={() => onOpen(cita)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(cita)}>
      <td>
        <time dateTime={cita.fecha}>{fmtFechaCorta(cita.fecha)}</time>
      </td>
      <td className="num">{cita.hora}</td>
      <td>
        <div className="cell-cliente">
          <div className="mini-avatar">{initials(cita.cliente)}</div>
          <div>
            <div className="strong">{cita.cliente}</div>
            <div className="muted small">{cita.telefono}</div>
          </div>
        </div>
      </td>
      <td>{cita.servicio}</td>
      <td className="num strong">{fmtCOP(cita.precio)}</td>
      <td><StatusPill estado={cita.estado} /></td>
      <td><Icon name="chevron_right" size={14} /></td>
    </tr>
  )
})

/* ── Constantes de filtros ──────────────────────────────────────── */
const FILTROS_ESTADO: { key: EstadoCita | 'todos'; label: string }[] = [
  { key: 'todos',      label: 'Todos'      },
  { key: 'confirmada', label: 'Confirmadas' },
  { key: 'completada', label: 'Completadas' },
  { key: 'pendiente',  label: 'Pendientes'  },
  { key: 'cancelada',  label: 'Canceladas'  },
  { key: 'no-show',    label: 'No show'     },
]

const FILTROS_FECHA: { key: FiltroFecha; label: string }[] = [
  { key: 'mes',    label: 'Este mes'    },
  { key: 'semana', label: 'Esta semana' },
  { key: 'año',    label: 'Este año'   },
  { key: 'todo',   label: 'Todo'       },
]

/* ── Componente principal ─────────────────────────────────────────── */
const PAGE_SIZE = 20

export function HistorialPage() {
  const [busqueda,      setBusqueda]      = useState('')
  const [filtroEstado,  setFiltroEstado]  = useState<EstadoCita | 'todos'>('todos')
  const [filtroFecha,   setFiltroFecha]   = useState<FiltroFecha>('mes')
  const [pagina,        setPagina]        = useState(1)
  const [citaAbierta,   setCitaAbierta]   = useState<Cita | null>(null)

  const { filtered, stats, loading } = useFilteredHistorial({
    busqueda,
    filtroEstado,
    filtroFecha,
  })

  /* Paginación simple */
  const totalPaginas = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageCitas    = useMemo(
    () => filtered.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE),
    [filtered, pagina],
  )

  // Resetear página cuando cambian filtros
  const handleEstado = useCallback((k: EstadoCita | 'todos') => {
    setFiltroEstado(k)
    setPagina(1)
  }, [])
  const handleFecha = useCallback((k: FiltroFecha) => {
    setFiltroFecha(k)
    setPagina(1)
  }, [])
  const handleBusqueda = useCallback((v: string) => {
    setBusqueda(v)
    setPagina(1)
  }, [])

  const onOpenCita  = useCallback((c: Cita) => setCitaAbierta(c), [])
  const onCloseCita = useCallback(() => setCitaAbierta(null), [])

  return (
    <div className="page">
      <Topbar
        title="Historial de citas"
        subtitle="Todo lo que ha pasado por tu agenda"
        actions={
          <button className="btn ghost" type="button">
            <Icon name="download" size={15} /> Exportar CSV
          </button>
        }
      />

      <div className="page-body">
        {/* Stats del periodo filtrado */}
        <div className="stat-row stat-row--3">
          <Stat
            label="Citas en el periodo"
            value={String(filtered.length)}
            sub="Filtros aplicados"
          />
          <Stat
            label="Ingresos totales"
            value={fmtCOP(stats.ingresos)}
            sub="Solo confirmadas y completadas"
          />
          <Stat
            label="Tasa de no-show"
            value={`${stats.nsRate}%`}
            sub={`${stats.nsCount} de ${filtered.length} citas en el periodo`}
            accent={stats.nsRate > 10}
          />
        </div>

        {/* Tabla con filtros */}
        <Card
          title={
            <div className="hist-filters">
              <SearchInput
                value={busqueda}
                onChange={handleBusqueda}
                placeholder="Buscar cliente o servicio…"
                inline
              />
              {/* Filtro periodo */}
              <div className="seg" role="group" aria-label="Filtrar por periodo">
                {FILTROS_FECHA.map(({ key, label }) => (
                  <button
                    key={key}
                    className={filtroFecha === key ? 'is-on' : ''}
                    onClick={() => handleFecha(key)}
                    aria-pressed={filtroFecha === key}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Filtro estado */}
              <div className="seg" role="group" aria-label="Filtrar por estado">
                {FILTROS_ESTADO.map(({ key, label }) => (
                  <button
                    key={key}
                    className={filtroEstado === key ? 'is-on' : ''}
                    onClick={() => handleEstado(key)}
                    aria-pressed={filtroEstado === key}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          }
          flush
        >
          {loading && filtered.length === 0 ? (
            <p style={{ padding: 32, color: 'var(--muted)' }} aria-live="polite">Cargando…</p>
          ) : (
            <>
              <table className="table table--historial" aria-label="Historial de citas">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th className="num">Monto</th>
                    <th>Estado</th>
                    <th aria-hidden="true" />
                  </tr>
                </thead>
                <tbody>
                  {pageCitas.map((c) => (
                    <HistorialRow key={c.id} cita={c} onOpen={onOpenCita} />
                  ))}
                  {pageCitas.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                        No hay citas con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pie: total + paginación */}
              <div className="table-foot">
                <span className="muted">
                  Mostrando {pageCitas.length} de {filtered.length} citas
                </span>
                {totalPaginas > 1 && (
                  <nav className="pager" aria-label="Páginas del historial">
                    <IconButton
                      icon="chevron_left"
                      label="Página anterior"
                      onClick={() => setPagina((p) => Math.max(1, p - 1))}
                      disabled={pagina === 1}
                    />
                    <span aria-live="polite">{pagina} / {totalPaginas}</span>
                    <IconButton
                      icon="chevron_right"
                      label="Página siguiente"
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

      {citaAbierta && (
        <CitaModal cita={citaAbierta} onClose={onCloseCita} />
      )}
    </div>
  )
}
