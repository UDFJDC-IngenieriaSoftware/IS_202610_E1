/**
 * DashboardPage — /panel/dashboard
 *
 * Performance:
 *  - useAllCitas() carga los datos una sola vez.
 *  - stats y weekSummary calculados con useMemo.
 *  - CitaListItem envuelto en React.memo para evitar re-renders.
 *  - onOpenCita estabilizado con useCallback.
 */
import { useState, useMemo, useCallback, memo } from 'react'
import { useNavigate }    from 'react-router-dom'
import { Topbar }         from '../../components/organisms/Topbar'
import { Card }           from '../../components/organisms/Card'
import { CitaModal }      from '../../components/organisms/CitaModal'
import { Stat }           from '../../components/molecules/Stat'
import { QuickAction }    from '../../components/molecules/QuickAction'
import { StatusPill }     from '../../components/atoms/StatusPill'
import { Icon }           from '../../components/atoms/Icon'
import { useAllCitas }    from '../../hooks/useCitas'
import { useAuth }        from '../../hooks/useAuth'
import { HOY_ISO, buildWeek } from '../../utils/dates'
import { fmtCOP, fmtFechaLarga } from '../../utils/format'
import { ESTADO_CITA_META }     from '../../types/estados'
import type { Cita }             from '../../types'

/* ── Constantes de dominio ─────────────────────────────────────────── */
const MAX_SLOTS_DIA = 14   // bloques disponibles por día (para % ocupación)
const MES_PREFIX    = HOY_ISO.slice(0, 7)

/* ── Átomo local: fila de cita (memoizado) ─────────────────────────── */
const CitaListItem = memo(function CitaListItem({
  cita,
  onOpen,
}: {
  cita: Cita
  onOpen: (c: Cita) => void
}) {
  const meta = ESTADO_CITA_META[cita.estado]
  return (
    <li>
      <button
        type="button"
        className="cita-row"
        onClick={() => onOpen(cita)}
        aria-label={`Ver detalle: ${cita.cliente}, ${cita.servicio} a las ${cita.hora}`}
      >
        <div className="cita-time">
          <div className="cita-hora">{cita.hora}</div>
          <div className="cita-dur">{cita.duracion} min</div>
        </div>
        <div className="cita-bar" style={{ background: meta.fg }} aria-hidden="true" />
        <div className="cita-info">
          <div className="cita-cliente">{cita.cliente}</div>
          <div className="cita-servicio">{cita.servicio} · {fmtCOP(cita.precio)}</div>
        </div>
        <StatusPill estado={cita.estado} />
        <Icon name="chevron_right" size={16} />
      </button>
    </li>
  )
})

/* ── Componente principal ─────────────────────────────────────────── */
export function DashboardPage() {
  const navigate                    = useNavigate()
  const { perfil }                  = useAuth()
  const { data: allCitas, loading } = useAllCitas()
  const [citaAbierta, setCitaAbierta] = useState<Cita | null>(null)

  const onOpenCita  = useCallback((c: Cita) => setCitaAbierta(c), [])
  const onCloseCita = useCallback(() => setCitaAbierta(null), [])

  /* ── Stats calculadas con useMemo ────────────────────────────────── */
  const stats = useMemo(() => {
    if (!allCitas) return null
    const hoy = allCitas.filter((c) => c.fecha === HOY_ISO)
    const confirmadas = hoy.filter(
      (c) => c.estado === 'confirmada' || c.estado === 'completada',
    )
    const completadas  = hoy.filter((c) => c.estado === 'completada')
    const pendientes   = hoy.filter(
      (c) => !['completada', 'cancelada', 'no-show', 'bloqueado'].includes(c.estado),
    )
    const noShows = allCitas.filter(
      (c) => c.estado === 'no-show' && c.fecha.startsWith(MES_PREFIX),
    )
    const ingresoTotal = confirmadas.reduce((s, c) => s + c.precio, 0)
    const ingresoPSE   = Math.round(ingresoTotal * 0.5)
    const ocupacion    = Math.round((hoy.length / MAX_SLOTS_DIA) * 100)
    const proximas     = hoy
      .filter((c) => c.estado !== 'completada')
      .sort((a, b) => a.hora.localeCompare(b.hora))
      .slice(0, 6)
    return {
      totalHoy: hoy.length,
      completadasHoy: completadas.length,
      pendientesHoy: pendientes.length,
      ingresoTotal,
      ingresoPSE,
      ocupacion,
      noShows: noShows.length,
      proximas,
    }
  }, [allCitas])

  /* ── Resumen de la semana (barras de ocupación) ──────────────────── */
  const weekSummary = useMemo(() => {
    if (!allCitas) return []
    return buildWeek(HOY_ISO).map((day) => {
      const n   = allCitas.filter((c) => c.fecha === day.iso).length
      const pct = Math.min(100, Math.round((n / MAX_SLOTS_DIA) * 100))
      return {
        ...day,
        n,
        pct,
        isClosed:  day.dayName === 'dom',
        isFuture:  day.iso > HOY_ISO,
      }
    })
  }, [allCitas])

  const weekTotals = useMemo(() => {
    if (!allCitas) return null
    const semana = weekSummary
    const total = semana.reduce((s, d) => s + d.n, 0)
    const ingresos = allCitas
      .filter((c) => {
        const d = weekSummary.find((wd) => wd.iso === c.fecha)
        return d && (c.estado === 'confirmada' || c.estado === 'completada')
      })
      .reduce((s, c) => s + c.precio, 0)
    return { total, ingresos, promedio: semana.filter((d) => !d.isClosed).length > 0
      ? (total / semana.filter((d) => !d.isClosed).length).toFixed(1) : '0' }
  }, [allCitas, weekSummary])

  /* ── Título del topbar ───────────────────────────────────────────── */
  const tituloFecha = (() => {
    const f = fmtFechaLarga(HOY_ISO)
    return f.charAt(0).toUpperCase() + f.slice(1)
  })()
  const nombreBarbero = perfil?.nombre?.split(' ')[0] ?? 'Andrés'

  if (loading && !allCitas) {
    return (
      <div className="page">
        <div className="page-body" aria-live="polite" aria-busy="true">
          <p style={{ color: 'var(--muted)', padding: 32 }}>Cargando…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Topbar
        title={tituloFecha}
        subtitle={`Buenos días, ${nombreBarbero}. Tienes ${stats?.pendientesHoy ?? 0} citas pendientes hoy.`}
        actions={
          <button className="btn primary" type="button">
            <Icon name="add" size={16} /> Nueva cita
          </button>
        }
      />

      <div className="page-body">
        {/* ── Fila de stats ─────────────────────────────────────── */}
        <div className="stat-row">
          <Stat
            label="Citas hoy"
            value={String(stats?.totalHoy ?? 0)}
            sub={`${stats?.completadasHoy ?? 0} ya completadas · ${stats?.pendientesHoy ?? 0} pendientes`}
            trend="up"
            trendLabel="+2 vs. ayer"
          />
          <Stat
            label="Ingresos del día"
            value={fmtCOP(stats?.ingresoTotal ?? 0)}
            sub={`${fmtCOP(stats?.ingresoPSE ?? 0)} ya recibidos por anticipo`}
            trend="up"
            trendLabel="+12% vs. promedio"
          />
          <Stat
            label="Ocupación"
            value={`${stats?.ocupacion ?? 0}%`}
            sub={`${stats?.totalHoy ?? 0} de ${MAX_SLOTS_DIA} bloques agendados`}
            trend="flat"
            trendLabel="Día casi lleno"
          />
          <Stat
            label="No shows · mayo"
            value={String(stats?.noShows ?? 0)}
            sub="Bajaron desde 6 en abril"
            trend="down"
            trendLabel="−66%"
            accent
          />
        </div>

        {/* ── Grid de 2 columnas ────────────────────────────────── */}
        <div className="grid-2col">
          {/* Próximas citas */}
          <Card
            title="Próximas citas hoy"
            action={
              <button className="btn ghost-sm" type="button" onClick={() => navigate('/panel/agenda')}>
                Ver agenda completa <Icon name="chevron_right" size={14} />
              </button>
            }
            flush
          >
            {stats?.proximas.length === 0 ? (
              <p style={{ padding: '24px', color: 'var(--muted)', fontSize: 14 }}>
                No hay más citas para hoy.
              </p>
            ) : (
              <ul className="cita-list" aria-label="Próximas citas">
                {stats?.proximas.map((c) => (
                  <CitaListItem key={c.id} cita={c} onOpen={onOpenCita} />
                ))}
              </ul>
            )}
          </Card>

          {/* Columna derecha: accesos rápidos + resumen semana */}
          <div className="stack">
            <Card title="Accesos rápidos">
              <div className="qa-grid">
                <QuickAction
                  icon="block"
                  label="Bloquear horario"
                  sub="Marcar como no disponible"
                  onClick={() => navigate('/panel/horario')}
                />
                <QuickAction
                  icon="content_cut"
                  label="Nuevo servicio"
                  sub="Agregar al catálogo"
                  onClick={() => navigate('/panel/servicios')}
                />
                <QuickAction
                  icon="schedule"
                  label="Ajustar horario"
                  sub="Día por día"
                  onClick={() => navigate('/panel/horario')}
                />
                <QuickAction
                  icon="whatsapp"
                  label="Mensaje masivo"
                  sub="Notificar a clientes"
                  onClick={() => {}}
                />
              </div>
            </Card>

            <Card title="Resumen de la semana">
              <div className="week-summary" aria-label="Ocupación por día de la semana">
                {weekSummary.map((d) => (
                  <div
                    key={d.iso}
                    className={[
                      'week-bar',
                      d.iso === HOY_ISO ? 'is-today'  : '',
                      d.isClosed        ? 'is-closed' : '',
                      d.isFuture        ? 'is-future' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <div className="wb-track">
                      <div className="wb-fill" style={{ height: `${d.pct}%` }} />
                    </div>
                    <div className="wb-num">{d.isClosed ? '—' : d.n}</div>
                    <div className="wb-day">{d.dayName.slice(0, 3)}</div>
                  </div>
                ))}
              </div>
              {weekTotals && (
                <div className="week-foot">
                  <div><span className="muted">Total semana</span> <strong>{weekTotals.total} citas</strong></div>
                  <div><span className="muted">Ingresos</span> <strong>{fmtCOP(weekTotals.ingresos)}</strong></div>
                  <div><span className="muted">Promedio diario</span> <strong>{weekTotals.promedio}</strong></div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* ── Modal de detalle de cita ─────────────────────────────── */}
      {citaAbierta && (
        <CitaModal cita={citaAbierta} onClose={onCloseCita} />
      )}
    </div>
  )
}
