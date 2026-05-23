/**
 * ServiciosPage — /panel/servicios
 *
 * Lista editable de servicios. Permite toggle activo/pausado,
 * editar y eliminar. Usa estado local inicializado desde el servicio
 * para soportar mutaciones optimistas sin parpadeo.
 *
 * Performance: filas de tabla envueltas en React.memo.
 */
import { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react'
import { Topbar }          from '../../components/organisms/Topbar'
import { Card }            from '../../components/organisms/Card'
import { ServicioModal }   from '../../components/organisms/ServicioModal'
import { Stat }            from '../../components/molecules/Stat'
import { Toggle }          from '../../components/atoms/Toggle'
import { IconButton }      from '../../components/atoms/IconButton'
import { Icon }            from '../../components/atoms/Icon'
import { useServicios }    from '../../hooks/useServicios'
import {
  updateServicio,
  deleteServicio,
  createServicio,
} from '../../services/servicios.service'
import { fmtCOP } from '../../utils/format'
import type { Servicio }   from '../../types'

/* ── Fila de tabla memoizada ─────────────────────────────────────── */
const ServicioRow = memo(function ServicioRow({
  servicio,
  onToggle,
  onEdit,
  onDelete,
}: {
  servicio: Servicio
  onToggle: (id: string) => void
  onEdit:   (s: Servicio) => void
  onDelete: (id: string) => void
}) {
  return (
    <tr className={servicio.activo ? '' : 'row--off'}>
      <td>
        <div className="svc-name">{servicio.nombre}</div>
        <div className="svc-desc">{servicio.descripcion}</div>
      </td>
      <td className="num">{servicio.duracion} min</td>
      <td className="num strong">{fmtCOP(servicio.precio)}</td>
      <td className="num muted">{fmtCOP(servicio.precio / 2)}</td>
      <td>
        <Toggle
          checked={servicio.activo}
          onChange={() => onToggle(servicio.id)}
          label={servicio.activo ? 'Activo' : 'Pausado'}
        />
      </td>
      <td className="row-actions">
        <IconButton
          icon="edit"
          label={`Editar ${servicio.nombre}`}
          ghost
          size={15}
          onClick={() => onEdit(servicio)}
        />
        <IconButton
          icon="delete"
          label={`Eliminar ${servicio.nombre}`}
          ghost
          size={15}
          onClick={() => onDelete(servicio.id)}
        />
      </td>
    </tr>
  )
})

/* ── Componente principal ─────────────────────────────────────────── */
export function ServiciosPage() {
  const { data, loading } = useServicios()

  /* Estado local para mutaciones optimistas */
  const [servicios, setServicios] = useState<Servicio[]>([])
  const initialized               = useRef(false)

  useEffect(() => {
    if (data && !initialized.current) {
      setServicios([...data])
      initialized.current = true
    }
  }, [data])

  const [editando, setEditando] = useState<Servicio | 'nuevo' | null>(null)

  /* ── Stats calculadas con useMemo ──────────────────────────────── */
  const stats = useMemo(() => {
    const activos = servicios.filter((s) => s.activo)
    const precioProm = activos.length > 0
      ? Math.round(activos.reduce((s, x) => s + x.precio, 0) / activos.length)
      : 0
    const durProm = activos.length > 0
      ? Math.round(activos.reduce((s, x) => s + x.duracion, 0) / activos.length)
      : 0
    return {
      activos: activos.length,
      pausados: servicios.length - activos.length,
      precioProm,
      durProm,
    }
  }, [servicios])

  /* ── Handlers ──────────────────────────────────────────────────── */
  const handleToggle = useCallback(async (id: string) => {
    const svc = servicios.find((s) => s.id === id)
    if (!svc) return
    // Optimistic update
    setServicios((prev) =>
      prev.map((s) => s.id === id ? { ...s, activo: !s.activo } : s),
    )
    await updateServicio(id, { activo: !svc.activo })
  }, [servicios])

  const handleDelete = useCallback(async (id: string) => {
    setServicios((prev) => prev.filter((s) => s.id !== id))
    await deleteServicio(id)
  }, [])

  const handleEdit   = useCallback((s: Servicio) => setEditando(s), [])

  const handleSave = useCallback(async (
    form: Omit<Servicio, 'id'>,
    id?: string,
  ) => {
    if (id) {
      const updated = await updateServicio(id, form)
      setServicios((prev) => prev.map((s) => s.id === id ? updated : s))
    } else {
      const created = await createServicio(form)
      setServicios((prev) => [...prev, created])
    }
  }, [])

  if (loading && servicios.length === 0) {
    return (
      <div className="page">
        <div className="page-body" aria-live="polite" aria-busy="true">
          <p style={{ color: 'var(--muted)', padding: 32 }}>Cargando servicios…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Topbar
        title="Servicios"
        subtitle="Lo que ofreces y aparece en el bot de WhatsApp"
        actions={
          <button
            className="btn primary"
            type="button"
            onClick={() => setEditando('nuevo')}
          >
            <Icon name="add" size={16} /> Agregar servicio
          </button>
        }
      />

      <div className="page-body">
        {/* Stats */}
        <div className="stat-row stat-row--3">
          <Stat
            label="Servicios activos"
            value={String(stats.activos)}
            sub={`${stats.pausados} pausados`}
          />
          <Stat
            label="Precio promedio"
            value={fmtCOP(stats.precioProm)}
            sub="Por servicio activo"
          />
          <Stat
            label="Duración promedio"
            value={`${stats.durProm} min`}
            sub="Por servicio activo"
          />
        </div>

        {/* Tabla de servicios */}
        <Card title="Catálogo" flush>
          <table className="table table--servicios" aria-label="Servicios del barbero">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Duración</th>
                <th>Precio</th>
                <th>Anticipo (50%)</th>
                <th>Estado</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {servicios.map((s) => (
                <ServicioRow
                  key={s.id}
                  servicio={s}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Modal crear / editar */}
      {editando !== null && (
        <ServicioModal
          servicio={editando === 'nuevo' ? undefined : editando}
          onClose={() => setEditando(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
