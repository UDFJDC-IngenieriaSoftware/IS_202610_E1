/**
 * HorarioPage — /panel/horario
 *
 * Editor de horario semanal + días libres.
 * Estado local inicializado desde el servicio; "Guardar cambios" aplica
 * las mutaciones vía updateHorarioDia.
 */
import { useState, useEffect, useMemo, useRef } from 'react'
import { Topbar }          from '../../components/organisms/Topbar'
import { Card }            from '../../components/organisms/Card'
import { Icon }            from '../../components/atoms/Icon'
import { Toggle }          from '../../components/atoms/Toggle'
import { IconButton }      from '../../components/atoms/IconButton'
import { useHorario, useDiasLibres } from '../../hooks/useHorario'
import {
  updateHorarioDia,
  addDiaLibre,
  removeDiaLibre,
} from '../../services/horario.service'
import { fmtFechaCorta } from '../../utils/format'
import type { HorarioDia, DiaLibre } from '../../types'

/* ── Opciones de hora (cada 30 min, de 6:00 a 22:30) ──────────────── */
const HORAS_OPTS: string[] = []
for (let h = 6; h <= 22; h++) {
  HORAS_OPTS.push(`${String(h).padStart(2, '0')}:00`)
  HORAS_OPTS.push(`${String(h).padStart(2, '0')}:30`)
}

const MESES_CORTOS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

/* ── Componente principal ─────────────────────────────────────────── */
export function HorarioPage() {
  const { data: horarioInit, loading: loadingH } = useHorario()
  const { data: dlInit,      loading: loadingDL } = useDiasLibres()

  const [horario,    setHorario]    = useState<HorarioDia[]>([])
  const [diasLibres, setDiasLibres] = useState<DiaLibre[]>([])
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const initH  = useRef(false)
  const initDL = useRef(false)

  /* Nuevas DL */
  const [nuevaFecha,  setNuevaFecha]  = useState('')
  const [nuevoMotivo, setNuevoMotivo] = useState('')

  useEffect(() => {
    if (horarioInit && !initH.current) {
      setHorario([...horarioInit])
      initH.current = true
    }
  }, [horarioInit])

  useEffect(() => {
    if (dlInit && !initDL.current) {
      setDiasLibres([...dlInit])
      initDL.current = true
    }
  }, [dlInit])

  /* ── Helpers de horario ──────────────────────────────────────────── */
  function updH(idx: number, patch: Partial<Omit<HorarioDia, 'dia' | 'idx'>>) {
    setHorario((prev) =>
      prev.map((d) => d.idx === idx ? { ...d, ...patch } : d),
    )
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await Promise.all(
        horario.map((d) => updateHorarioDia(d.idx, {
          activo:      d.activo,
          inicio:      d.inicio,
          fin:         d.fin,
          descansoIni: d.descansoIni,
          descansoFin: d.descansoFin,
        })),
      )
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  /* ── Helpers de días libres ──────────────────────────────────────── */
  async function handleAddDL() {
    if (!nuevaFecha || !nuevoMotivo.trim()) return
    const nueva = await addDiaLibre({ fecha: nuevaFecha, motivo: nuevoMotivo.trim() })
    setDiasLibres((prev) => [...prev, nueva].sort((a, b) => a.fecha.localeCompare(b.fecha)))
    setNuevaFecha('')
    setNuevoMotivo('')
  }

  async function handleRemoveDL(id: string) {
    setDiasLibres((prev) => prev.filter((d) => d.id !== id))
    await removeDiaLibre(id)
  }

  /* ── Resumen calculado ───────────────────────────────────────────── */
  const resumen = useMemo(() => {
    const laborables = horario.filter((d) => d.activo)
    const horasTotales = laborables.reduce((s, d) => {
      const [hi, mi] = d.inicio.split(':').map(Number)
      const [hf, mf] = d.fin.split(':').map(Number)
      const abiertoMin = (hf * 60 + mf) - (hi * 60 + mi)
      let descansoMin = 0
      if (d.descansoIni && d.descansoFin) {
        const [hdi, mdi] = d.descansoIni.split(':').map(Number)
        const [hdf, mdf] = d.descansoFin.split(':').map(Number)
        descansoMin = (hdf * 60 + mdf) - (hdi * 60 + mdi)
      }
      return s + (abiertoMin - descansoMin) / 60
    }, 0)
    const proximoDL = diasLibres.find((d) => d.fecha >= new Date().toISOString().slice(0, 10))
    return {
      diasLab: laborables.length,
      horas: Math.round(horasTotales),
      proximoDL: proximoDL ? fmtFechaCorta(proximoDL.fecha) : '—',
      capacidad: Math.round((horasTotales / 0.75) * 2),  // ~1 cita por 30 min
    }
  }, [horario, diasLibres])

  const loading = loadingH || loadingDL

  if (loading && horario.length === 0) {
    return (
      <div className="page">
        <div className="page-body" aria-live="polite" aria-busy="true">
          <p style={{ color: 'var(--muted)', padding: 32 }}>Cargando horario…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Topbar
        title="Horario"
        subtitle="Define cuándo aceptas citas. El bot de WhatsApp solo ofrece estos horarios."
        actions={
          <button
            className="btn primary"
            type="button"
            onClick={handleSave}
            disabled={saving}
            aria-busy={saving}
          >
            <Icon name="check" size={15} />
            {saving ? 'Guardando…' : saved ? '¡Guardado!' : 'Guardar cambios'}
          </button>
        }
      />

      <div className="page-body">
        <div className="grid-2col grid-2col--wide">
          {/* ── Horario semanal ─────────────────────────────── */}
          <Card title="Horario semanal" flush>
            <div className="schedule">
              {horario.map((d) => (
                <div
                  key={d.idx}
                  className={`sched-row${d.activo ? '' : ' is-off'}`}
                >
                  <div className="sched-day">
                    <Toggle
                      id={`toggle-dia-${d.idx}`}
                      checked={d.activo}
                      onChange={(v) => updH(d.idx, { activo: v })}
                    />
                    <div>
                      <div className="sched-name">{d.dia}</div>
                      <div className="sched-status">{d.activo ? 'Abierto' : 'Cerrado'}</div>
                    </div>
                  </div>

                  {d.activo ? (
                    <div className="sched-times">
                      <div className="time-block">
                        <span className="tb-label">Apertura</span>
                        <select
                          value={d.inicio}
                          onChange={(e) => updH(d.idx, { inicio: e.target.value })}
                          aria-label={`Apertura ${d.dia}`}
                        >
                          {HORAS_OPTS.map((h) => <option key={h}>{h}</option>)}
                        </select>
                      </div>
                      <span className="tb-arrow" aria-hidden="true">→</span>
                      <div className="time-block">
                        <span className="tb-label">Cierre</span>
                        <select
                          value={d.fin}
                          onChange={(e) => updH(d.idx, { fin: e.target.value })}
                          aria-label={`Cierre ${d.dia}`}
                        >
                          {HORAS_OPTS.map((h) => <option key={h}>{h}</option>)}
                        </select>
                      </div>
                      <div className="sched-break">
                        <span className="tb-label">Descanso</span>
                        <select
                          value={d.descansoIni}
                          onChange={(e) => updH(d.idx, { descansoIni: e.target.value, descansoFin: e.target.value ? d.descansoFin || e.target.value : '' })}
                          aria-label={`Inicio descanso ${d.dia}`}
                        >
                          <option value="">Sin descanso</option>
                          {HORAS_OPTS.map((h) => <option key={h}>{h}</option>)}
                        </select>
                        {d.descansoIni && (
                          <>
                            <span className="tb-arrow" aria-hidden="true">→</span>
                            <select
                              value={d.descansoFin}
                              onChange={(e) => updH(d.idx, { descansoFin: e.target.value })}
                              aria-label={`Fin descanso ${d.dia}`}
                            >
                              {HORAS_OPTS.map((h) => <option key={h}>{h}</option>)}
                            </select>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="sched-times sched-times--off">Día no laborable</div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* ── Columna derecha ─────────────────────────────── */}
          <div className="stack">
            {/* Días libres */}
            <Card
              title="Días libres y vacaciones"
              action={
                <button
                  className="btn ghost-sm"
                  type="button"
                  onClick={handleAddDL}
                  disabled={!nuevaFecha || !nuevoMotivo.trim()}
                >
                  <Icon name="add" size={14} /> Agregar
                </button>
              }
            >
              {/* Formulario rápido */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <label className="field" style={{ flex: '1 1 140px', margin: 0 }}>
                  <span style={{ fontSize: 12 }}>Fecha</span>
                  <input
                    type="date"
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                  />
                </label>
                <label className="field" style={{ flex: '2 1 160px', margin: 0 }}>
                  <span style={{ fontSize: 12 }}>Motivo</span>
                  <input
                    type="text"
                    value={nuevoMotivo}
                    onChange={(e) => setNuevoMotivo(e.target.value)}
                    placeholder="Ej. Día festivo"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDL()}
                  />
                </label>
              </div>

              <ul className="dias-libres">
                {diasLibres.map((d) => {
                  const fecha = new Date(d.fecha + 'T12:00:00')
                  return (
                    <li key={d.id} className="dl-row">
                      <div className="dl-date">
                        <div className="dl-day">{fecha.getDate()}</div>
                        <div className="dl-mon">{MESES_CORTOS[fecha.getMonth()]}</div>
                      </div>
                      <div className="dl-info">
                        <div className="dl-motivo">{d.motivo}</div>
                        <div className="dl-fecha">{fmtFechaCorta(d.fecha)}</div>
                      </div>
                      <IconButton
                        icon="delete"
                        label={`Quitar ${d.motivo}`}
                        ghost
                        size={14}
                        onClick={() => handleRemoveDL(d.id)}
                      />
                    </li>
                  )
                })}
                {diasLibres.length === 0 && (
                  <li style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>
                    Sin días libres registrados.
                  </li>
                )}
              </ul>
            </Card>

            {/* Resumen */}
            <Card title="Resumen">
              <div className="stack-tight">
                <div className="kv">
                  <span>Días laborables</span>
                  <strong>{resumen.diasLab} días/semana</strong>
                </div>
                <div className="kv">
                  <span>Horas abiertas</span>
                  <strong>{resumen.horas} horas/semana</strong>
                </div>
                <div className="kv">
                  <span>Próximo día libre</span>
                  <strong>{resumen.proximoDL}</strong>
                </div>
                <div className="kv">
                  <span>Capacidad estimada</span>
                  <strong>~{resumen.capacidad} citas/sem</strong>
                </div>
              </div>
              <div className="alert" role="note">
                <Icon name="info" size={16} />
                <div>
                  Si cambias el horario, las citas ya confirmadas se mantienen.
                  Solo afecta nuevas reservas.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
