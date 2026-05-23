/**
 * LoadingSpinner — indicador de carga accesible.
 *
 * Accesibilidad:
 *  - role="status" + aria-live="polite": anuncia la carga a lectores de pantalla
 *    sin interrumpir la narración en curso.
 *  - aria-label descriptivo para contexto.
 *  - El ícono tiene aria-hidden para que el texto aria-label sea el único anuncio.
 */
interface LoadingSpinnerProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = { sm: 20, md: 28, lg: 40 } as const

export function LoadingSpinner({
  label = 'Cargando…',
  size = 'md',
}: LoadingSpinnerProps) {
  const px = SIZE_MAP[size]
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            8,
        color:          'var(--muted, #888)',
        fontSize:       14,
      }}
    >
      <span
        className="material-symbols-rounded"
        aria-hidden="true"
        style={{
          fontSize:  px,
          animation: 'spin 1s linear infinite',
        }}
      >
        progress_activity
      </span>
      <span className="sr-only">{label}</span>
    </div>
  )
}
