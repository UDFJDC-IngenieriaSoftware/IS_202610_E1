/**
 * Organismo ServicioModal — formulario de creación / edición de servicio.
 *
 * Accesibilidad:
 *  - Validación client-side con mensajes de error asociados via aria-describedby
 *  - Región aria-live="assertive" anuncia errores al lector sin esperar foco
 *  - aria-busy="true" en el botón submit mientras guarda
 *  - Hereda focus-trap y scroll-lock del <Modal> base
 */
import { useState, useId, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Icon }  from '../atoms/Icon'
import { fmtCOP } from '../../utils/format'
import type { Servicio } from '../../types'

type ServicioForm = Omit<Servicio, 'id'>

interface ServicioModalProps {
  servicio?: Servicio
  onClose: () => void
  onSave: (data: ServicioForm, id?: string) => Promise<void>
}

const DURACIONES = [
  { value: 15,  label: '15 minutos' },
  { value: 30,  label: '30 minutos' },
  { value: 45,  label: '45 minutos' },
  { value: 60,  label: '1 hora'     },
  { value: 90,  label: '1 h 30 min' },
]

interface FormErrors {
  nombre?: string
  precio?: string
}

function validate(form: ServicioForm): FormErrors {
  const err: FormErrors = {}
  if (!form.nombre.trim()) err.nombre = 'El nombre es obligatorio.'
  if (form.precio < 1000)  err.precio = 'El precio mínimo es $1.000.'
  return err
}

export function ServicioModal({ servicio, onClose, onSave }: ServicioModalProps) {
  const isNew  = !servicio
  const uid    = useId()

  const [form, setForm] = useState<ServicioForm>({
    nombre:      servicio?.nombre      ?? '',
    descripcion: servicio?.descripcion ?? '',
    duracion:    servicio?.duracion    ?? 30,
    precio:      servicio?.precio      ?? 25000,
    activo:      servicio?.activo      ?? true,
  })
  const [errors,  setErrors]  = useState<FormErrors>({})
  const [saving,  setSaving]  = useState(false)
  const [saveErr, setSaveErr] = useState('')

  function upd<K extends keyof ServicioForm>(key: K, val: ServicioForm[K]) {
    setForm((f) => ({ ...f, [key]: val }))
    // Limpiar error del campo al editarlo
    if (key in errors) setErrors((e) => { const n = { ...e }; delete n[key as keyof FormErrors]; return n })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    setSaveErr('')
    try {
      await onSave(form, servicio?.id)
      onClose()
    } catch {
      setSaveErr('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const nombreErrId = `${uid}-nombre-err`
  const precioErrId = `${uid}-precio-err`
  const saveErrId   = `${uid}-save-err`

  return (
    <Modal
      title={isNew ? 'Nuevo servicio' : 'Editar servicio'}
      onClose={onClose}
      maxW={520}
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        {/* Región de error global (aria-live) */}
        <div
          id={saveErrId}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          style={{ minHeight: 0 }}
        >
          {saveErr && (
            <div className="field-error" style={{ marginBottom: 12 }}>
              <Icon name="warning" size={13} /> {saveErr}
            </div>
          )}
        </div>

        {/* Nombre */}
        <label className="field" htmlFor={`${uid}-nombre`}>
          <span>Nombre del servicio</span>
          <input
            id={`${uid}-nombre`}
            type="text"
            value={form.nombre}
            onChange={(e) => upd('nombre', e.target.value)}
            placeholder="Corte clásico"
            aria-required="true"
            aria-invalid={!!errors.nombre}
            aria-describedby={errors.nombre ? nombreErrId : undefined}
          />
          {errors.nombre && (
            <span id={nombreErrId} className="field-error" role="alert">
              <Icon name="warning" size={12} /> {errors.nombre}
            </span>
          )}
        </label>

        {/* Descripción */}
        <label className="field" htmlFor={`${uid}-desc`}>
          <span>Descripción corta</span>
          <input
            id={`${uid}-desc`}
            type="text"
            value={form.descripcion}
            onChange={(e) => upd('descripcion', e.target.value)}
            placeholder="Cómo aparecerá en WhatsApp"
          />
        </label>

        <div className="field-row">
          {/* Duración */}
          <label className="field" htmlFor={`${uid}-dur`}>
            <span>Duración</span>
            <select
              id={`${uid}-dur`}
              value={form.duracion}
              onChange={(e) => upd('duracion', Number(e.target.value))}
            >
              {DURACIONES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </label>

          {/* Precio */}
          <label className="field" htmlFor={`${uid}-precio`}>
            <span>Precio (COP)</span>
            <input
              id={`${uid}-precio`}
              type="number"
              min={1000}
              step={1000}
              value={form.precio}
              onChange={(e) => upd('precio', Number(e.target.value))}
              aria-required="true"
              aria-invalid={!!errors.precio}
              aria-describedby={errors.precio ? precioErrId : undefined}
            />
            {errors.precio && (
              <span id={precioErrId} className="field-error" role="alert">
                <Icon name="warning" size={12} /> {errors.precio}
              </span>
            )}
          </label>
        </div>

        {/* Hint anticipo */}
        <div className="anticipo-hint">
          <Icon name="attach_money" size={16} />
          El cliente paga{' '}
          <strong>{fmtCOP(form.precio / 2)}</strong> de anticipo vía PSE para confirmar
        </div>

        <div className="modal-foot">
          <button className="btn ghost" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn primary"
            type="submit"
            disabled={saving}
            aria-busy={saving}
            aria-describedby={saveErr ? saveErrId : undefined}
          >
            <Icon name="check" size={15} />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
