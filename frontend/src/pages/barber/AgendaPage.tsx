/**
 * AgendaPage — /panel/agenda
 *
 * Vistas: semana (WeekGrid) y mes (MonthGrid).
 * Performance:
 *  - useAllCitas() una sola carga para ambas vistas.
 *  - byDay agrupado con useMemo.
 *  - posiciones de eventos (top/height) calculadas con useMemo por día.
 *  - CalEvent y MonthCell envueltos en React.memo.
 */
import { useState, useMemo, useCallback, memo } from 'react'
import { Topbar }       from '../../components/organisms/Topbar'
import { CitaModal }    from '../../components/organisms/CitaModal'
import { LegendItem }   from '../../components/molecules/LegendItem'
import { Icon }         from '../../components/atoms/Icon'
import { IconButton }   from '../../components/atoms/IconButton'
import { useAllCitas }  from '../../hooks/useCitas'
import { HOY_ISO, buildWeek, buildMonthGrid, addDays, monthName, yearOf } from '../../utils/dates'
import { ESTADO_CITA_META } from '../../types/estados'
import type { Cita, EstadoCita } from '../../types'

/* ── Constantes de la grilla ────────────────────────────────────────── */
const ROW_H   = 56    // px por hora
const START_H = 8     // hora de inicio de la grilla
const END_H   = 20    // hora final de la grilla
const HOURS   = Array.from({ length: END_H - START_H }, (_, i) => START_H + i)

function eventTop(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return (h - START_H) * ROW_H + (m / 60) * ROW_H
}
function eventHeight(duracion: number): number {
  return (duracion / 60) * ROW_H - 2
}
function estadoToCalClass(estado: EstadoCita): string {
  if (estado === 'completada') return 'cal-event--confirmada'
  if (estado === 'no-show')    return 'cal-event--cancelada'
  if (estado === 'bloqueado')  return 'cal-event--blocked'
  return `cal-event--${estado}`
}

/* ── Átomo evento memoizado ─────────────────────────────────────────── */
const CalEvent = memo(function CalEvent({
  cita,
  onOpen,
}: {
  cita: Cita
  onOpen: (c: Cita) => void
}) {
  const meta  = ESTADO_CITA_META[cita.estado]
  const cls   = estadoToCalClass(cita.estado)
  return (
    <button
      type="button"
      className={`cal-event ${cls}`}
      style={{ top: eventTop(cita.hora), height: eventHeight(cita.duracion) }}
      onClick={() => onOpen(cita)}
    >
      <div className="ce-bar" style={{ background: meta.fg }} />
      <div className="ce-body">
        <div className="ce-title">{cita.cliente}</div>
        <div className="ce-meta">{cita.hora} · {cita.servicio}</div>
      </div>
    </button>
  )
})

/* ── Celda de mes memoizada ─────────────────────────────────────────── */
const MonthCell = memo(function MonthCell({
  iso,
  num,
  isToday,
  citas,
  onOpen,
}: {
  iso: string | null
  num: number | null
  isToday: boolean
  citas: Cita[]
  onOpen: (c: Cita) => void
}) {
  if (!iso || num === null) {
    return <div className="month-cell month-cell--empty" aria-hidden="true" />
  }
  const visible = citas.slice(0, 3)
  const extra   = citas.length - 3
  return (
    <div className={`month-cell${isToday ? ' is-today' : ''}`}>
      <div className="mc-num">{num}</div>
      <div className="mc-events">
        {visible.map((c) => (
          <button key={c.id} type="button" className="mc-event" onClick={() => onOpen(c)}>
            <span
              className="mc-dot"
              style={{ background: ESTADO_CITA_META[c.estado].fg }}
            />
            <span className="mc-time">{c.hora}</span>
            <span className="mc-name">{c.cliente.split(' ')[0]}</span>
          </button>
        ))}
        {extra > 0 && <div className="mc-more">+{extra} más</div>}
      </div>
    </div>
  )
})

/* ── Componente principal ─────────────────────────────────────────── */
type VistaAgenda = 'dia' | 'semana' | 'mes'

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function AgendaPage() {
  const { data: allCitas, loading } = useAllCitas()
  const [vista, setVista]           = useState<VistaAgenda>('semana')
  const [isoRef, setIsoRef]         = useState(HOY_ISO)
  const [citaAbierta, setCita]      = useState<Cita | null>(null)

  const onOpenCita  = useCallback((c: Cita) => setCita(c), [])
  const onCloseCita = useCallback(() => setCita(null), [])

  /* Navegación */
  const navDia    = useCallback((dir: -1 | 1) => setIsoRef((r) => addDays(r, dir)), [])
  const navSemana = useCallback((dir: -1 | 1) => setIsoRef((r) => addDays(r, dir * 7)), [])
  const navMes    = useCallback((dir: -1 | 1) => {
    const d = new Date(isoRef + 'T12:00:00')
    d.setMonth(d.getMonth() + dir)
    setIsoRef(d.toISOString().slice(0, 10))
  }, [isoRef])
  const irHoy = useCallback(() => setIsoRef(HOY_ISO), [])

  /* Semana actual */
  const week = useMemo(() => buildWeek(isoRef), [isoRef])

  /* byDay: mapa fecha → citas (memoizado) */
  const byDay = useMemo<Record<string, Cita[]>>(() => {
    if (!allCitas) return {}
    return allCitas.reduce<Record<string, Cita[]>>((acc, c) => {
      if (!acc[c.fecha]) acc[c.fecha] = []
      acc[c.fecha].push(c)
      return acc
    }, {})
  }, [allCitas])

  /* Posiciones de eventos por día (memoizado) */
  const weekEventPositions = useMemo(() => {
    return week.map((d) => ({
      ...d,
      citas: (byDay[d.iso] ?? []).sort((a, b) => a.hora.localeCompare(b.hora)),
    }))
  }, [week, byDay])

  /* Grilla del mes */
  const monthGrid = useMemo(() => buildMonthGrid(isoRef), [isoRef])

  /* Día de referencia (para vista día) */
  const refDate   = useMemo(() => new Date(isoRef + 'T12:00:00'), [isoRef])
  const dayName   = DAY_NAMES[refDate.getDay()]
  const dayNum    = refDate.getDate()
  const dayCitas  = useMemo(
    () => (byDay[isoRef] ?? []).sort((a, b) => a.hora.localeCompare(b.hora)),
    [byDay, isoRef],
  )

  /* Etiqueta de cabecera */
  const headerLabel = vista === 'semana'
    ? `${week[0].num} al ${week[6].num} de ${monthName(isoRef)} · ${yearOf(isoRef)}`
    : vista === 'mes'
      ? `${monthName(isoRef).charAt(0).toUpperCase()}${monthName(isoRef).slice(1)} ${yearOf(isoRef)}`
      : `${dayName} ${dayNum} de ${monthName(isoRef)} · ${yearOf(isoRef)}`

  /* Callbacks de navegación según vista activa */
  const navPrev = useCallback(() => {
    if (vista === 'dia') navDia(-1)
    else if (vista === 'semana') navSemana(-1)
    else navMes(-1)
  }, [vista, navDia, navSemana, navMes])
  const navNext = useCallback(() => {
    if (vista === 'dia') navDia(1)
    else if (vista === 'semana') navSemana(1)
    else navMes(1)
  }, [vista, navDia, navSemana, navMes])

  return (
    <div className="page">
      <Topbar
        title="Agenda"
        subtitle={headerLabel}
        actions={
          <>
            {/* Segmented: día / semana / mes */}
            <div className="seg" role="group" aria-label="Vista de agenda">
              <button
                className={vista === 'dia' ? 'is-on' : ''}
                onClick={() => setVista('dia')}
                aria-pressed={vista === 'dia'}
              >
                Día
              </button>
              <button
                className={vista === 'semana' ? 'is-on' : ''}
                onClick={() => setVista('semana')}
                aria-pressed={vista === 'semana'}
              >
                Semana
              </button>
              <button
                className={vista === 'mes' ? 'is-on' : ''}
                onClick={() => setVista('mes')}
                aria-pressed={vista === 'mes'}
              >
                Mes
              </button>
            </div>

            {/* Navegación */}
            <div className="seg-nav">
              <IconButton
                icon="chevron_left"
                label={vista === 'dia' ? 'Día anterior' : vista === 'semana' ? 'Semana anterior' : 'Mes anterior'}
                onClick={navPrev}
              />
              <button className="btn ghost-sm" type="button" onClick={irHoy}>
                Hoy
              </button>
              <IconButton
                icon="chevron_right"
                label={vista === 'dia' ? 'Día siguiente' : vista === 'semana' ? 'Semana siguiente' : 'Mes siguiente'}
                onClick={navNext}
              />
            </div>

            <button className="btn primary" type="button">
              <Icon name="add" size={16} /> Nueva cita
            </button>
          </>
        }
      />

      <div className="page-body">
        {loading && !allCitas && (
          <p style={{ color: 'var(--muted)', padding: 32 }} aria-live="polite">Cargando…</p>
        )}

        {/* ── Leyenda ──────────────────────────────────────────── */}
        <div className="legend" role="list" aria-label="Estados de cita">
          {(['confirmada', 'pendiente', 'cancelada', 'bloqueado'] as const).map((k) => (
            <LegendItem
              key={k}
              color={ESTADO_CITA_META[k].fg}
              label={ESTADO_CITA_META[k].label}
              desc={ESTADO_CITA_META[k].desc}
            />
          ))}
        </div>

        {/* ── Vista día ────────────────────────────────────────── */}
        {vista === 'dia' && (
          <div className="cal-card">
            <div
              className="cal-grid cal-grid--day"
              style={{ '--rowH': `${ROW_H}px` } as React.CSSProperties}
            >
              {/* Header */}
              <div className="cal-corner" aria-hidden="true" />
              <div className={`cal-dayhead${isoRef === HOY_ISO ? ' is-today' : ''}`}>
                <div className="cdh-day">{dayName}</div>
                <div className="cdh-num">{dayNum}</div>
              </div>

              {/* Gutter */}
              <div className="cal-gutter" aria-hidden="true">
                {HOURS.map((h) => (
                  <div key={h} className="cal-hour">
                    <span>{String(h).padStart(2, '0')}:00</span>
                  </div>
                ))}
              </div>

              {/* Columna única */}
              <div
                className={`cal-col${isoRef === HOY_ISO ? ' is-today' : ''}`}
                role="gridcell"
                aria-label={isoRef}
              >
                {HOURS.map((h) => (
                  <div key={h} className="cal-line" aria-hidden="true" />
                ))}
                {isoRef === HOY_ISO && (() => {
                  const now = new Date()
                  const topNow = eventTop(
                    `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
                  )
                  return (
                    <div className="cal-now" style={{ top: topNow }} aria-hidden="true">
                      <span className="cal-now-dot" />
                    </div>
                  )
                })()}
                {dayCitas.map((c) => (
                  <CalEvent key={c.id} cita={c} onOpen={onOpenCita} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Vista semana ─────────────────────────────────────── */}
        {vista === 'semana' && (
          <div className="cal-card">
            <div
              className="cal-grid"
              style={{ '--rowH': `${ROW_H}px` } as React.CSSProperties}
            >
              {/* Header */}
              <div className="cal-corner" aria-hidden="true" />
              {week.map((d) => (
                <div
                  key={d.iso}
                  className={`cal-dayhead${d.iso === HOY_ISO ? ' is-today' : ''}`}
                >
                  <div className="cdh-day">{d.dayName}</div>
                  <div className="cdh-num">{d.num}</div>
                </div>
              ))}

              {/* Gutter de horas */}
              <div className="cal-gutter" aria-hidden="true">
                {HOURS.map((h) => (
                  <div key={h} className="cal-hour">
                    <span>{String(h).padStart(2, '0')}:00</span>
                  </div>
                ))}
              </div>

              {/* Columnas de días */}
              {weekEventPositions.map((d) => (
                <div
                  key={d.iso}
                  className={`cal-col${d.iso === HOY_ISO ? ' is-today' : ''}`}
                  role="gridcell"
                  aria-label={d.iso}
                >
                  {/* Líneas de hora */}
                  {HOURS.map((h) => (
                    <div key={h} className="cal-line" aria-hidden="true" />
                  ))}

                  {/* Indicador "ahora" solo en hoy */}
                  {d.iso === HOY_ISO && (() => {
                    const now = new Date()
                    const topNow = eventTop(
                      `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
                    )
                    return (
                      <div className="cal-now" style={{ top: topNow }} aria-hidden="true">
                        <span className="cal-now-dot" />
                      </div>
                    )
                  })()}

                  {/* Citas */}
                  {d.citas.map((c) => (
                    <CalEvent key={c.id} cita={c} onOpen={onOpenCita} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Vista mes ────────────────────────────────────────── */}
        {vista === 'mes' && (
          <div className="month-card">
            <div className="month-head" role="row">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                <div key={d} className="month-dh" role="columnheader">{d}</div>
              ))}
            </div>
            <div className="month-grid" role="grid" aria-label="Calendario mensual">
              {monthGrid.map((cell, i) => (
                <MonthCell
                  key={i}
                  iso={cell.iso}
                  num={cell.num}
                  isToday={cell.isToday}
                  citas={cell.iso ? (byDay[cell.iso] ?? []) : []}
                  onOpen={onOpenCita}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {citaAbierta && (
        <CitaModal cita={citaAbierta} onClose={onCloseCita} />
      )}
    </div>
  )
}
