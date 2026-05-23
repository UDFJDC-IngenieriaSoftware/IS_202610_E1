/**
 * Molécula FieldInput — campo de formulario con label superior.
 */
import type { InputHTMLAttributes } from 'react'

interface FieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
  error?: string
}

export function FieldInput({ label, id, error, className, ...rest }: FieldInputProps) {
  return (
    <div className={`field${className ? ` ${className}` : ''}`}>
      <span id={`${id}-label`}>{label}</span>
      <input
        id={id}
        aria-labelledby={`${id}-label`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <span id={`${id}-error`} style={{ color: 'var(--st-red-fg)', fontSize: 11 }}>
          {error}
        </span>
      )}
    </div>
  )
}
