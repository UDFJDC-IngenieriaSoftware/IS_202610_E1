import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { z } from 'zod'
import { useFormValidation } from '../../src/hooks/useFormValidation'

describe('useFormValidation', () => {
  const testSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    name: z.string().min(2, 'Mínimo 2 caracteres'),
  })

  type TestForm = z.infer<typeof testSchema>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty values by default', () => {
      const onSubmit = vi.fn()
      const { result } = renderHook(() =>
        useFormValidation(testSchema, onSubmit),
      )

      expect(result.current.values).toEqual({})
      expect(result.current.errors).toEqual({})
      expect(result.current.isSubmitting).toBe(false)
    })

    it('should initialize with provided initial values', () => {
      const initialValues = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John',
      }
      const onSubmit = vi.fn()

      const { result } = renderHook(() =>
        useFormValidation(testSchema, onSubmit, initialValues),
      )

      expect(result.current.values).toEqual(initialValues)
    })

    it('should return register function', () => {
      const { result } = renderHook(() =>
        useFormValidation(testSchema, vi.fn()),
      )

      expect(typeof result.current.register).toBe('function')
    })

    it('should return handleSubmit function', () => {
      const { result } = renderHook(() =>
        useFormValidation(testSchema, vi.fn()),
      )

      expect(typeof result.current.handleSubmit).toBe('function')
    })
  })

  describe('register', () => {
    it('should return input props for a field', () => {
      const { result } = renderHook(() =>
        useFormValidation(testSchema, vi.fn()),
      )

      const emailInput = result.current.register('email')

      expect(emailInput).toHaveProperty('name', 'email')
      expect(emailInput).toHaveProperty('onChange')
      expect(emailInput).toHaveProperty('onBlur')
    })

    it('should update field value on change', () => {
      const { result } = renderHook(() =>
        useFormValidation(testSchema, vi.fn()),
      )

      const emailInput = result.current.register('email')

      act(() => {
        emailInput.onChange({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.values.email).toBe('test@example.com')
    })

    it('should clear field error on change', () => {
      const { result } = renderHook(() =>
        useFormValidation(testSchema, vi.fn()),
      )

      act(() => {
        result.current.setFieldError('email', 'Invalid email')
      })

      expect(result.current.errors.email).toBe('Invalid email')

      const emailInput = result.current.register('email')
      act(() => {
        emailInput.onChange({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.errors.email).toBeUndefined()
    })
  })

  describe('handleSubmit', () => {
    it('should return function that calls onSubmit with valid data', async () => {
      const onSubmit = vi.fn()
      const { result } = renderHook(() =>
        useFormValidation(testSchema, onSubmit, {
          email: 'test@example.com',
          password: 'password123',
          name: 'John',
        }),
      )

      const submitHandler = result.current.handleSubmit(onSubmit)
      expect(typeof submitHandler).toBe('function')

      await act(async () => {
        await submitHandler({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(onSubmit).toHaveBeenCalled()
    })

    it('should prevent default form submission', async () => {
      const onSubmit = vi.fn()
      const preventDefault = vi.fn()
      const { result } = renderHook(() =>
        useFormValidation(testSchema, onSubmit, {
          email: 'test@example.com',
          password: 'password123',
          name: 'John',
        }),
      )

      const submitHandler = result.current.handleSubmit(onSubmit)

      await act(async () => {
        await submitHandler({
          preventDefault: preventDefault,
        } as any)
      })

      expect(preventDefault).toHaveBeenCalled()
    })

    it('should validate data before submitting', async () => {
      const onSubmit = vi.fn()
      const { result } = renderHook(() =>
        useFormValidation(testSchema, onSubmit, {
          email: 'invalid-email',
          password: 'short',
          name: 'J',
        }),
      )

      const submitHandler = result.current.handleSubmit(onSubmit)

      await act(async () => {
        await submitHandler({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(onSubmit).not.toHaveBeenCalled()
      expect(result.current.errors.email).toBeDefined()
    })

    it('should not call onSubmit if validation fails', async () => {
      const onSubmit = vi.fn()
      const { result } = renderHook(() =>
        useFormValidation(testSchema, onSubmit, {
          email: '',
          password: '',
          name: '',
        }),
      )

      const submitHandler = result.current.handleSubmit(onSubmit)

      await act(async () => {
        await submitHandler({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should clear errors before submission attempt', async () => {
      const onSubmit = vi.fn()
      const { result } = renderHook(() =>
        useFormValidation(testSchema, onSubmit, {
          email: 'test@example.com',
          password: 'password123',
          name: 'John',
        }),
      )

      act(() => {
        result.current.setFieldError('email', 'Old error')
      })

      expect(result.current.errors.email).toBe('Old error')

      const submitHandler = result.current.handleSubmit(onSubmit)

      await act(async () => {
        await submitHandler({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // After successful submission, errors should be cleared
      expect(Object.keys(result.current.errors).length).toBe(0)
    })
  })

  describe('setFieldError', () => {
    it('should set error for specific field', () => {
      const { result } = renderHook(() =>
        useFormValidation(testSchema, vi.fn()),
      )

      act(() => {
        result.current.setFieldError('email', 'Custom error')
      })

      expect(result.current.errors.email).toBe('Custom error')
    })

    it('should not affect other fields', () => {
      const { result } = renderHook(() =>
        useFormValidation(testSchema, vi.fn()),
      )

      act(() => {
        result.current.setFieldError('email', 'Email error')
      })

      expect(result.current.errors.email).toBe('Email error')
      expect(result.current.errors.password).toBeUndefined()
    })
  })

  describe('reset', () => {
    it('should reset values to initial state', () => {
      const initialValues = {
        email: 'initial@example.com',
        password: 'password123',
        name: 'John',
      }
      const { result } = renderHook(() =>
        useFormValidation(testSchema, vi.fn(), initialValues),
      )

      act(() => {
        result.current.register('email').onChange({
          target: { value: 'changed@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.values.email).toBe('changed@example.com')

      act(() => {
        result.current.reset()
      })

      expect(result.current.values).toEqual(initialValues)
    })

    it('should clear errors on reset', () => {
      const { result } = renderHook(() =>
        useFormValidation(testSchema, vi.fn()),
      )

      act(() => {
        result.current.setFieldError('email', 'Error')
      })

      expect(result.current.errors.email).toBe('Error')

      act(() => {
        result.current.reset()
      })

      expect(result.current.errors).toEqual({})
    })
  })
})
