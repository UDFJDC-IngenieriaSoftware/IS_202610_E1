/**
 * Organismo CitaModal — detalle de una cita con acciones.
 *
 * Accesibilidad:
 *  - Región aria-live="polite" anuncia el resultado de las acciones al lector
 *  - Botón "Marcar completada" deshabilitado cuando la cita ya está completada
 *  - Hereda focus-trap y scroll-lock del <Modal> base
 */
import { useCallback, useState } from 'react'
import { Modal }      from './Modal'
import { StatusPill } from '../atoms/StatusPill'
import { Icon }           from '../atoms/Icon'
import { WhatsAppIcon }   from '../atoms/WhatsAppIcon'
import { fmtCOP, fmtFechaLarga, initials } from '../../utils/format'
import type { Cita } from '../../types'

interface CitaModalProps {
  cita: Cita
  onClose: () => void
  onMarcarCompletada?: (id: string) => void
  onCancelar?: (id: string) => void
}

export function CitaModal({ cita, onClose, onMarcarCompletada, onCancelar }: CitaModalProps) {
  const anticipo   = cita.precio / 2
  const restante   = cita.precio - anticipo
  const pagado     = cita.estado === 'confirmada' || cita.estado === 'completada'
  const fechaLarga = fmtFechaLarga(cita.fecha)
  const iniciales  = initials(cita.cliente)

  const [feedback, setFeedback] = useState('')

  const handleCompletada = useCallback(() => {
    onMarcarCompletada?.(cita.id)
    setFeedback('Cita marcada como completada.')
    // Dar tiempo a que el lector lo anuncie antes de cerrar
    setTimeout(onClose, 600)
  }, [onMarcarCompletada, cita.id, onClose])

  const handleCancelar = useCallback(() => {
    onCancelar?.(cita.id)
    setFeedback('Cita cancelada.')
    setTimeout(onClose, 600)
  }, [onCancelar, cita.id, onClose])

  return (
    <Modal title="Detalle de cita" onClose={onClose} maxW={560}>
      {/* Cabecera: hora + estado */}
      <div className="cd-head">
        <div className="cd-time">
          <div className="cd-hora">{cita.hora}</div>
          <div className="cd-fecha">
            {fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)}
          </div>
          <div className="cd-dur">{cita.duracion} minutos</div>
        </div>
        <StatusPill estado={cita.estado} />
      </div>

      {/* Cliente */}
      <div className="cd-section">
        <div className="cd-section-label">Cliente</div>
        <div className="cd-cliente">
          <div className="cd-avatar">{iniciales}</div>
          <div>
            <div className="cd-nombre">{cita.cliente}</div>
            <div className="cd-tel">
              <Icon name="phone" size={13} />
              {' '}{cita.telefono}
            </div>
          </div>
          <div className="cd-cliente-meta">
            <div className="strong">8 visitas</div>
            <div className="muted small">desde feb. 2025</div>
          </div>
        </div>
      </div>

      {/* Servicio */}
      <div className="cd-section">
        <div className="cd-section-label">Servicio</div>
        <div className="cd-servicio">
          <div>
            <div className="strong">{cita.servicio}</div>
            <div className="muted small">{cita.duracion} min</div>
          </div>
          <div className="num strong">{fmtCOP(cita.precio)}</div>
        </div>
      </div>

      {/* Pago */}
      <div className="cd-section">
        <div className="cd-section-label">Pago</div>
        <div className="cd-pay">
          <div className="cd-pay-row">
            <span>Anticipo (50%) PSE</span>
            <span className={pagado ? 'strong ok' : 'muted'}>
              {pagado ? `Pagado · ${fmtCOP(anticipo)}` : 'Pendiente'}
            </span>
          </div>
          <div className="cd-pay-row">
            <span>Por cobrar en sitio</span>
            <span className="strong">{fmtCOP(restante)}</span>
          </div>
          <div className="cd-pay-row cd-pay-row--total">
            <span>Total</span>
            <span className="strong">{fmtCOP(cita.precio)}</span>
          </div>
        </div>
      </div>

      {/* Feedback aria-live */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {feedback}
      </div>

      {/* Acciones */}
      <div className="modal-foot modal-foot--3">
        <button
          className="btn ghost"
          type="button"
          onClick={handleCancelar}
          disabled={cita.estado === 'cancelada' || cita.estado === 'completada'}
        >
          <Icon name="close" size={15} /> Cancelar cita
        </button>
        <button className="btn ghost" type="button">
          <WhatsAppIcon size={15} /> Contactar
        </button>
        <button
          className="btn primary"
          type="button"
          disabled={cita.estado === 'completada'}
          onClick={handleCompletada}
        >
          <Icon name="check" size={15} /> Marcar completada
        </button>
      </div>
    </Modal>
  )
}
