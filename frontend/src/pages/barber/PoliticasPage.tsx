/**
 * PoliticasPage — /panel/politicas
 *
 * Formulario para configurar las políticas de cancelación,
 * reprogramación y plantillas de mensajes del barbero.
 */
import { useState, useId, useEffect, type FormEvent } from 'react'
import { Topbar } from '../../components/organisms/Topbar'
import { Card }   from '../../components/organisms/Card'
import { Icon }   from '../../components/atoms/Icon'
import { useAuth } from '../../hooks/useAuth'
import { request } from '../../services/apiClient'
import type { BarberoPerfil } from '../../types'

interface PoliticasForm {
  plazoCancelacion:    string
  plazoReprogramacion: string
  mensajeBienvenida:   string
  mensajeConfirmacion: string
  mensajeRecordatorio: string
}

function perfilToForm(p: BarberoPerfil | null): PoliticasForm {
  return {
    plazoCancelacion:    p?.plazoCancelacion    != null ? String(p.plazoCancelacion)    : '',
    plazoReprogramacion: p?.plazoReprogramacion != null ? String(p.plazoReprogramacion) : '',
    mensajeBienvenida:   p?.mensajeBienvenida   ?? '',
    mensajeConfirmacion: p?.mensajeConfirmacion ?? '',
    mensajeRecordatorio: p?.mensajeRecordatorio ?? '',
  }
}

export function PoliticasPage() {
  const { perfil } = useAuth()
  const uid = useId()

  const [form, setForm]       = useState<PoliticasForm>(() => perfilToForm(perfil))
  const [formReady, setReady] = useState(perfil !== null)
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)
  const [error,  setError]    = useState('')

  // Sync form when perfil loads from the API (async on page reload)
  useEffect(() => {
    if (perfil !== null) {
      setForm(perfilToForm(perfil))
      setReady(true)
    }
  }, [perfil])

  function upd<K extends keyof PoliticasForm>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }))
    setSaved(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          plazoCancelacion:    form.plazoCancelacion    !== '' ? Number(form.plazoCancelacion)    : null,
          plazoReprogramacion: form.plazoReprogramacion !== '' ? Number(form.plazoReprogramacion) : null,
          mensajeBienvenida:   form.mensajeBienvenida   || null,
          mensajeConfirmacion: form.mensajeConfirmacion || null,
          mensajeRecordatorio: form.mensajeRecordatorio || null,
        }),
      })
      setSaved(true)
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (!formReady) {
    return (
      <div className="page">
        <div className="page-body" aria-live="polite" aria-busy="true">
          <p style={{ color: 'var(--muted)', padding: 32 }}>Cargando políticas…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Topbar
        title="Políticas de cancelación"
        subtitle="Configura los plazos y mensajes automáticos para tus clientes"
      />

      <div className="page-body">
        <form className="form" onSubmit={handleSubmit} noValidate aria-label="Formulario de políticas">
          {/* Plazos */}
          <Card title="Plazos mínimos">
            <div className="field-row" style={{ padding: '0 0 16px' }}>
              <label className="field" htmlFor={`${uid}-cancelacion`}>
                <span>Plazo de cancelación (horas)</span>
                <input
                  id={`${uid}-cancelacion`}
                  type="number"
                  min={0}
                  step={1}
                  value={form.plazoCancelacion}
                  onChange={(e) => upd('plazoCancelacion', e.target.value)}
                  placeholder="Sin restricción"
                />
                <span className="field-hint">Horas mínimas de anticipación para que el cliente pueda cancelar.</span>
              </label>
              <label className="field" htmlFor={`${uid}-reprogramacion`}>
                <span>Plazo de reprogramación (horas)</span>
                <input
                  id={`${uid}-reprogramacion`}
                  type="number"
                  min={0}
                  step={1}
                  value={form.plazoReprogramacion}
                  onChange={(e) => upd('plazoReprogramacion', e.target.value)}
                  placeholder="Sin restricción"
                />
                <span className="field-hint">Horas mínimas de anticipación para reprogramar.</span>
              </label>
            </div>
          </Card>

          {/* Mensajes */}
          <Card title="Mensajes automáticos" style={{ marginTop: 16 }}>
            <div style={{ padding: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label className="field" htmlFor={`${uid}-bienvenida`}>
                <span>Mensaje de bienvenida</span>
                <textarea
                  id={`${uid}-bienvenida`}
                  rows={3}
                  value={form.mensajeBienvenida}
                  onChange={(e) => upd('mensajeBienvenida', e.target.value)}
                  placeholder="Hola {nombre}, gracias por reservar con nosotros…"
                />
                <span className="field-hint">Enviado al cliente cuando reserva una cita.</span>
              </label>
              <label className="field" htmlFor={`${uid}-confirmacion`}>
                <span>Mensaje de confirmación de pago</span>
                <textarea
                  id={`${uid}-confirmacion`}
                  rows={3}
                  value={form.mensajeConfirmacion}
                  onChange={(e) => upd('mensajeConfirmacion', e.target.value)}
                  placeholder="Tu cita está confirmada para el {fecha} a las {hora}…"
                />
                <span className="field-hint">Enviado al confirmar el pago del anticipo.</span>
              </label>
              <label className="field" htmlFor={`${uid}-recordatorio`}>
                <span>Mensaje de recordatorio</span>
                <textarea
                  id={`${uid}-recordatorio`}
                  rows={3}
                  value={form.mensajeRecordatorio}
                  onChange={(e) => upd('mensajeRecordatorio', e.target.value)}
                  placeholder="Recuerda que tienes cita mañana a las {hora}…"
                />
                <span className="field-hint">Enviado automáticamente 24 h y 2 h antes de la cita.</span>
              </label>
            </div>
          </Card>

          {/* Acciones */}
          <div className="modal-foot" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            {error && (
              <span className="field-error">
                <Icon name="warning" size={13} /> {error}
              </span>
            )}
            {saved && (
              <span style={{ color: 'var(--success, green)', fontSize: 13 }}>
                <Icon name="check_circle" size={13} /> Cambios guardados
              </span>
            )}
            <button
              type="submit"
              className="btn primary"
              disabled={saving}
              aria-busy={saving}
            >
              <Icon name="save" size={14} /> {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
