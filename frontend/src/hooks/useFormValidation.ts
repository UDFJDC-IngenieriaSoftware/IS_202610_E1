/**
 * Hook reutilizable para validación de formularios con Zod + React Hook Form
 *
 * Uso:
 * ```typescript
 * const { register, handleSubmit, errors, isSubmitting } = useFormValidation(
 *   mySchema,
 *   onSubmit
 * )
 * ```
 */

import { useState } from 'react'
import type { ZodSchema } from 'zod'

export interface FormValidationResult<T> {
  register: (name: keyof T) => {
    name: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur: () => void
  }
  values: T
  errors: Partial<Record<keyof T, string>>
  isSubmitting: boolean
  handleSubmit: (callback: (data: T) => Promise<void> | void) => (e: React.FormEvent) => Promise<void>
  setFieldError: (field: keyof T, message: string) => void
  reset: () => void
}

export function useFormValidation<T extends Record<string, any>>(
  schema: ZodSchema,
  _onSubmit?: (data: T) => Promise<void> | void,
  initialValues?: T,
): FormValidationResult<T> {
  const [values, setValues] = useState<T>(initialValues || ({} as T))
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const register = (name: keyof T) => ({
    name: String(name),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [name]: e.target.value }))
      // Clear error on change
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }))
      }
    },
    onBlur: () => {
      // Validate single field on blur
      try {
        const fieldSchema = (schema as any).pick?.({ [name]: true })
        if (fieldSchema) {
          fieldSchema.parse({ [name]: values[name] })
          if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }))
          }
        }
      } catch (error: any) {
        if (error?.issues?.[0]) {
          setErrors((prev) => ({ ...prev, [name]: error.issues[0].message }))
        }
      }
    },
  })

  const handleSubmit = (callback: (data: T) => Promise<void> | void) => async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const validated = schema.parse(values) as T
      await callback(validated)
    } catch (error: any) {
      if (error?.issues) {
        const newErrors: Partial<Record<keyof T, string>> = {}
        error.issues.forEach((issue: any) => {
          const field = issue.path[0] as keyof T
          newErrors[field] = issue.message
        })
        setErrors(newErrors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const setFieldError = (field: keyof T, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }))
  }

  const reset = () => {
    setValues(initialValues || ({} as T))
    setErrors({})
  }

  return {
    register,
    values,
    errors,
    isSubmitting,
    handleSubmit,
    setFieldError,
    reset,
  }
}
