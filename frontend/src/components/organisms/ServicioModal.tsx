/**
 * Organismo ServicioModal — formulario de creación / edición de servicio.
 * TODO(step-10): extraído como organismo compartido; añadir validación.
 */
import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Icon } from '../atoms/Icon'
import { fmtCOP } from '../../utils/format'
import type { Servicio } from '../../types'

type ServicioForm = Omit<Servicio, 'id'>

interface ServicioModalProps {
  /** Pasa el servicio a editar, o undefined para crear uno nuevo */
  servicio?: Servicio
  onClose: () => void
  onSave: (data: ServicioForm, id?: string) => Promise<void>
}

const DURACIONES = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora'     },
  { value: 90, label: '1 h 30 min' },
]

export function ServicioModal({ servicio, onClose, onSave }: ServicioModalProps) {
  const isNew = !servicio
  const [form, setForm] = useState<ServicioForm>({
    nombre:      servicio?.nombre      ?? '',
    descripcion: servicio?.descripcion ?? '',
    duracion:    servicio?.duracion    ?? 30,
    precio:      servicio?.precio      ?? 25000,
    activo:      servicio?.activo      ?? true,
  })
  const [saving, setSaving] = useState(false)

  function upd<K extends keyof ServicioForm>(key: K, val: ServicioForm[K]) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form, servicio?.id)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isNew ? 'Nuevo servicio' : 'Editar servicio'}
      onClose={onClose}
      maxW={520}
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>Nombre del servicio</span>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => upd('nombre', e.target.value)}
            placeholder="Corte clásico"
            required
          />
        </label>

        <label className="field">
          <span>Descripción corta</span>
          <input
            type="text"
            value={form.descripcion}
            onChange={(e) => upd('descripcion', e.target.value)}
            placeholder="Cómo aparecerá en WhatsApp"
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Duración</span>
            <select
              value={form.duracion}
              onChange={(e) => upd('duracion', Number(e.target.value))}
            >
              {DURACIONES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Precio (COP)</span>
            <input
              type="number"
              min={1000}
              step={1000}
              value={form.precio}
              onChange={(e) => upd('precio', Number(e.target.value))}
              required
            />
          </label>
        </div>

        <div className="anticipo-hint">
          <Icon name="attach_money" size={16} />
          El cliente paga{' '}
          <strong>{fmtCOP(form.precio / 2)}</strong> de anticipo vía PSE para confirmar
        </div>

        <div className="modal-foot">
          <button className="btn ghost" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" type="submit" disabled={saving} aria-busy={saving}>
            <Icon name="check" size={15} />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
