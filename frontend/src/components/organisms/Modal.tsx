/**
 * Organismo Modal — shell base reutilizable.
 * TODO(step-10): añadir trap-focus, transición de entrada y aria-live.
 */
import { type ReactNode, useEffect } from 'react'
import { IconButton } from '../atoms/IconButton'

interface ModalProps {
  title: string
  onClose: () => void
  maxW?: number
  children: ReactNode
}

export function Modal({ title, onClose, maxW = 560, children }: ModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="modal"
        style={{ maxWidth: maxW }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <IconButton icon="close" label="Cerrar" ghost size={18} onClick={onClose} />
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
