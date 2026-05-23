/**
 * Molécula FieldSelect — select de formulario con label superior.
 */
import type { SelectHTMLAttributes } from 'react'

interface FieldSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  id: string
  options: ReadonlyArray<{ value: string; label: string }>
  error?: string
}

export function FieldSelect({
  label,
  id,
  options,
  error,
  className,
  ...rest
}: FieldSelectProps) {
  return (
    <div className={`field${className ? ` ${className}` : ''}`}>
      <span id={`${id}-label`}>{label}</span>
      <select
        id={id}
        aria-labelledby={`${id}-label`}
        aria-invalid={error ? true : undefined}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span style={{ color: 'var(--st-red-fg)', fontSize: 11 }}>{error}</span>
      )}
    </div>
  )
}
