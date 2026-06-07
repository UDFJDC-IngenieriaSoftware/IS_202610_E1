/**
 * Organismo ClienteModal — perfil del cliente + edición inline.
 *
 * Secciones:
 *  - Info personal con botón "Editar" que abre campos inline
 *  - Estadísticas: total citas, última visita, servicio frecuente
 *  - Acciones: Editar / Guardar / Cancelar
 */
import { useState, useId, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Icon }  from '../atoms/Icon'
import { fmtFechaCorta } from '../../utils/format'
import type { ClienteConStats } from '../../types'

interface ClienteModalProps {
  cliente: ClienteConStats
  onClose: () => void
  onSave?: (id: string, data: Partial<Pick<ClienteConStats, 'nombres' | 'apellidos' | 'email'>>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

interface FormState {
  nombres: string
  apellidos: string
  email: string
}

export function ClienteModal({ cliente, onClose, onSave, onDelete }: ClienteModalProps) {
  const uid = useId()
  const [editing, setEditing]           = useState(false)
  const [saving,  setSaving]            = useState(false)
  const [saveErr, setSaveErr]           = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting,  setDeleting]        = useState(false)
  const [deleteErr, setDeleteErr]       = useState('')
  const [form, setForm] = useState<FormState>({
    nombres:   cliente.nombres,
    apellidos: cliente.apellidos,
    email:     cliente.email,
  })

  function upd<K extends keyof FormState>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!form.nombres.trim()) { setSaveErr('El nombre es obligatorio.'); return }
    setSaving(true)
    setSaveErr('')
    try {
      await onSave?.(cliente.id, {
        nombres:   form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        email:     form.email.trim(),
      })
      setEditing(false)
    } catch {
      setSaveErr('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteErr('')
    try {
      await onDelete?.(cliente.id)
      onClose()
    } catch {
      setDeleteErr('No se pudo eliminar. El cliente puede tener citas activas.')
      setDeleting(false)
    }
  }

  const nombreCompleto = `${cliente.nombres} ${cliente.apellidos}`.trim()

  return (
    <Modal title="Perfil del cliente" onClose={onClose} maxW={520}>
      {/* Cabecera */}
      <div className="cd-head">
        <div className="cd-avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
          {cliente.nombres[0]}{cliente.apellidos[0]}
        </div>
        <div>
          <div className="cd-nombre" style={{ fontSize: 18 }}>{nombreCompleto}</div>
          <div className="cd-tel">
            <Icon name="phone" size={13} /> {cliente.celular}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="cd-section">
        <div className="cd-section-label">Estadísticas</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="strong" style={{ fontSize: 20 }}>{cliente.totalCitas}</div>
            <div className="muted small">citas totales</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="strong">{cliente.ultimaVisita ? fmtFechaCorta(cliente.ultimaVisita) : '—'}</div>
            <div className="muted small">última visita</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="strong" style={{ fontSize: 13 }}>{cliente.servicioFrecuente ?? '—'}</div>
            <div className="muted small">servicio frecuente</div>
          </div>
        </div>
      </div>

      {/* Info / Formulario */}
      <div className="cd-section">
        <div className="cd-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Información</span>
          {!editing && (
            <button className="btn ghost" type="button" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => setEditing(true)}>
              <Icon name="edit" size={13} /> Editar
            </button>
          )}
        </div>

        {editing ? (
          <form className="form" onSubmit={handleSave} noValidate>
            {saveErr && (
              <div className="field-error" style={{ marginBottom: 8 }}>
                <Icon name="warning" size={13} /> {saveErr}
              </div>
            )}
            <div className="field-row">
              <label className="field" htmlFor={`${uid}-nombres`}>
                <span>Nombre</span>
                <input id={`${uid}-nombres`} type="text" value={form.nombres} onChange={(e) => upd('nombres', e.target.value)} aria-required="true" />
              </label>
              <label className="field" htmlFor={`${uid}-apellidos`}>
                <span>Apellido</span>
                <input id={`${uid}-apellidos`} type="text" value={form.apellidos} onChange={(e) => upd('apellidos', e.target.value)} />
              </label>
            </div>
            <label className="field" htmlFor={`${uid}-email`}>
              <span>Email</span>
              <input id={`${uid}-email`} type="email" value={form.email} onChange={(e) => upd('email', e.target.value)} />
            </label>
            <div className="modal-foot" style={{ marginTop: 12 }}>
              <button type="button" className="btn ghost" onClick={() => { setEditing(false); setSaveErr('') }}>Cancelar</button>
              <button type="submit" className="btn primary" disabled={saving} aria-busy={saving}>
                <Icon name="check" size={14} /> {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
            <div><span className="muted">Email: </span>{cliente.email || '—'}</div>
            <div><span className="muted">Celular: </span>{cliente.celular}</div>
          </div>
        )}
      </div>

      {!editing && (
        <div className="modal-foot" style={{ justifyContent: 'space-between' }}>
          {onDelete && !confirmDelete && (
            <button
              className="btn danger-ghost"
              type="button"
              onClick={() => setConfirmDelete(true)}
            >
              <Icon name="delete" size={14} /> Eliminar
            </button>
          )}
          {confirmDelete && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              {deleteErr && (
                <span className="field-error" style={{ fontSize: 12 }}>
                  <Icon name="warning" size={12} /> {deleteErr}
                </span>
              )}
              {!deleteErr && (
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                  ¿Confirmar eliminación?
                </span>
              )}
              <button
                className="btn danger"
                type="button"
                disabled={deleting}
                aria-busy={deleting}
                onClick={handleDelete}
              >
                {deleting ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={() => { setConfirmDelete(false); setDeleteErr('') }}
              >
                Cancelar
              </button>
            </div>
          )}
          {!confirmDelete && (
            <button className="btn ghost" type="button" onClick={onClose}>Cerrar</button>
          )}
        </div>
      )}
    </Modal>
  )
}
