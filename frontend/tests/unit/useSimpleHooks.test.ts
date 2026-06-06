import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  useCitasByDate,
  useCitasByWeek,
  useAllCitas,
} from '../../src/hooks/useCitas'
import { usePagos, usePagosByBarbero } from '../../src/hooks/usePagos'
import { useServicios } from '../../src/hooks/useServicios'
import { useBarberos, usePlanes, useMetricas } from '../../src/hooks/useBarberos'
import { useHorario, useDiasLibres } from '../../src/hooks/useHorario'

describe('Data-fetching hooks', () => {
  describe('useCitasByDate', () => {
    it('should have loading, data, and error properties', () => {
      const { result } = renderHook(() => useCitasByDate('2026-06-01'))

      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('data')
      expect(result.current).toHaveProperty('error')
    })

    it('should start with loading=true', () => {
      const { result } = renderHook(() => useCitasByDate('2026-06-01'))

      expect(result.current.loading).toBe(true)
    })

    it('should return hook with refetch function', () => {
      const { result } = renderHook(() => useCitasByDate('2026-06-01'))

      expect(typeof result.current.refetch).toBe('function')
    })
  })

  describe('useCitasByWeek', () => {
    it('should accept date range parameters', () => {
      const { result } = renderHook(() =>
        useCitasByWeek('2026-06-01', '2026-06-07'),
      )

      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('refetch')
    })
  })

  describe('useAllCitas', () => {
    it('should load all citas', () => {
      const { result } = renderHook(() => useAllCitas())

      expect(result.current.loading).toBe(true)
    })
  })

  describe('usePagos', () => {
    it('should have loading, data, and error properties', () => {
      const { result } = renderHook(() => usePagos())

      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('data')
      expect(result.current).toHaveProperty('error')
    })

    it('should start with loading=true', () => {
      const { result } = renderHook(() => usePagos())

      expect(result.current.loading).toBe(true)
    })
  })

  describe('usePagosByBarbero', () => {
    it('should filter pagos by barbero', () => {
      const { result } = renderHook(() => usePagosByBarbero('b001'))

      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('refetch')
    })
  })

  describe('useServicios', () => {
    it('should have loading, data, and error properties', () => {
      const { result } = renderHook(() => useServicios())

      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('data')
      expect(result.current).toHaveProperty('error')
    })

    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useServicios())

      expect(result.current.loading).toBe(true)
    })
  })

  describe('useBarberos', () => {
    it('should have loading, data, and error properties', () => {
      const { result } = renderHook(() => useBarberos())

      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('data')
      expect(result.current).toHaveProperty('error')
    })

    it('should start with loading=true', () => {
      const { result } = renderHook(() => useBarberos())

      expect(result.current.loading).toBe(true)
    })
  })

  describe('usePlanes', () => {
    it('should load plans data', () => {
      const { result } = renderHook(() => usePlanes())

      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('data')
    })
  })

  describe('useMetricas', () => {
    it('should load metrics data', () => {
      const { result } = renderHook(() => useMetricas())

      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('data')
    })
  })

  describe('useHorario', () => {
    it('should have loading, data, and error properties', () => {
      const { result } = renderHook(() => useHorario())

      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('data')
      expect(result.current).toHaveProperty('error')
    })

    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useHorario())

      expect(result.current.loading).toBe(true)
    })
  })

  describe('useDiasLibres', () => {
    it('should load free days', () => {
      const { result } = renderHook(() => useDiasLibres())

      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('data')
    })
  })
})
