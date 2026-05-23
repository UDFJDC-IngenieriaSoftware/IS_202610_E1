/**
 * Organismo Modal — shell base reutilizable.
 *
 * Accesibilidad:
 *  - role="dialog" + aria-modal="true" + aria-labelledby={titleId}
 *  - Focus trap: Tab/Shift+Tab cicla dentro del diálogo
 *  - Al abrir: foca el primer elemento interactivo
 *  - Al cerrar: restaura el foco al elemento que lo tenía antes
 *  - Escape → cierra con animación de salida
 *  - Body overflow:hidden mientras está abierto
 *
 * Animación:
 *  - Entrada: fadeIn (backdrop) + pop (modal)
 *  - Salida:  fadeOut (backdrop) + popOut (modal)
 *    El cierre real se dispara al terminar la animación fadeOut del backdrop.
 */
import { type ReactNode, useEffect, useRef, useId, useState, useCallback } from 'react'
import { IconButton } from '../atoms/IconButton'

interface ModalProps {
  title: string
  onClose: () => void
  maxW?: number
  children: ReactNode
}

/** Selectores de elementos que pueden recibir foco */
const FOCUSABLE_SEL = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SEL))
}

export function Modal({ title, onClose, maxW = 560, children }: ModalProps) {
  const titleId   = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const prevFocus = useRef<HTMLElement | null>(null)
  const [closing, setClosing] = useState(false)

  /* ── Inicialización: guardar foco previo, bloquear scroll, enfocar primer elemento ── */
  useEffect(() => {
    prevFocus.current = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden'

    // Nota: inert en #root requeriría Portal fuera del root — se omite aquí.
    // La aislación AT se logra con aria-modal="true" en el dialog.

    // Dar un tick para que el DOM esté listo antes de enfocar
    const timer = setTimeout(() => {
      const first = getFocusable(dialogRef.current!)[0]
      first?.focus()
    }, 16)

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
      prevFocus.current?.focus()
    }
  }, [])

  /* ── Iniciar animación de cierre; onClose se llama al terminar la animación ── */
  const handleClose = useCallback(() => {
    if (!closing) setClosing(true)
  }, [closing])

  /* ── Cuando termina la animación fadeOut del backdrop, disparar onClose ── */
  const handleBackdropAnimEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>) => {
      if (closing && e.animationName === 'fadeOut') onClose()
    },
    [closing, onClose],
  )

  /* ── Escape key ─────────────────────────────────────────────────────── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handleClose])

  /* ── Focus trap ─────────────────────────────────────────────────────── */
  useEffect(() => {
    function onTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const el = dialogRef.current
      if (!el) return
      const focusable = getFocusable(el)
      if (!focusable.length) { e.preventDefault(); return }
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onTab)
    return () => document.removeEventListener('keydown', onTab)
  }, [])

  // El backdrop captura clicks de mouse para cerrar (conveniencia).
  // Teclado: Escape (useEffect arriba). AT: aria-modal="true" aísla el dialog.
  /* eslint-disable
     jsx-a11y/click-events-have-key-events,
     jsx-a11y/no-static-element-interactions,
     jsx-a11y/no-noninteractive-element-interactions */
  return (
    <div
      className={`modal-backdrop${closing ? ' modal-backdrop--closing' : ''}`}
      onClick={handleClose}
      onAnimationEnd={handleBackdropAnimEnd}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`modal${closing ? ' modal--closing' : ''}`}
        style={{ maxWidth: maxW }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3 id={titleId}>{title}</h3>
          <IconButton icon="close" label="Cerrar" ghost size={18} onClick={handleClose} />
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
