/**
 * Átomo Toggle — interruptor accesible (checkbox oculto + track visual).
 */
import { useId } from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  id?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, id, disabled }: ToggleProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <label className="toggle" htmlFor={inputId}>
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      {label && <span className="toggle-label">{label}</span>}
    </label>
  )
}
