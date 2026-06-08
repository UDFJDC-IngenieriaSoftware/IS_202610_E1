/**
 * useFilteredHistorial — combina debounce + useMemo para filtrar citas
 * en el historial sin recalcular el .filter() por cada tecla.
 *
 * Filtros:
 *  - busqueda: texto libre (cliente o servicio) — debounced 250ms
 *  - filtroEstado: estado de la cita o "todos"
 *  - filtroFecha: "mes" | "semana" | "año" | "todo"
 */
import { useMemo } from 'react'
import { useAllCitas } from './useCitas'
import { useDebounce } from './useDebounce'
import type { Cita, EstadoCita } from '../types'
import { HOY_ISO, buildWeek } from '../utils/dates'

export type FiltroFecha = 'mes' | 'semana' | 'año' | 'todo'

interface Options {
  busqueda: string
  filtroEstado: EstadoCita | 'todos'
  filtroFecha: FiltroFecha
}

export function useFilteredHistorial({ busqueda, filtroEstado, filtroFecha }: Options) {
  const { data: allCitas, loading, error, refetch } = useAllCitas()
  const debouncedBusqueda = useDebounce(busqueda, 250)

  const filtered = useMemo<Cita[]>(() => {
    if (!allCitas) return []

    // Orden: más reciente primero
    let lista = [...allCitas].sort(
      (a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora),
    )

    // Filtro de fecha
    if (filtroFecha !== 'todo') {
      if (filtroFecha === 'mes') {
        const prefix = HOY_ISO.slice(0, 7)   // 'YYYY-MM'
        lista = lista.filter((c) => c.fecha.startsWith(prefix))
      } else if (filtroFecha === 'semana') {
        const week = buildWeek(HOY_ISO)
        const start = week[0].iso
        const end   = week[6].iso
        lista = lista.filter((c) => c.fecha >= start && c.fecha <= end)
      } else if (filtroFecha === 'año') {
        const prefix = HOY_ISO.slice(0, 4)   // 'YYYY'
        lista = lista.filter((c) => c.fecha.startsWith(prefix))
      }
    }

    // Filtro de estado
    if (filtroEstado !== 'todos') {
      lista = lista.filter((c) => c.estado === filtroEstado)
    }

    // Búsqueda de texto (debounced)
    const q = debouncedBusqueda.trim().toLowerCase()
    if (q) {
      lista = lista.filter(
        (c) =>
          c.cliente.toLowerCase().includes(q) ||
          c.servicio.toLowerCase().includes(q),
      )
    }

    return lista
  }, [allCitas, debouncedBusqueda, filtroEstado, filtroFecha])

  // Estadísticas del periodo filtrado
  const stats = useMemo(() => {
    const ingresos = filtered
      .filter((c) => c.estado === 'completada' || c.estado === 'confirmada')
      .reduce((s, c) => s + c.precio, 0)
    const nsCount = filtered.filter((c) => c.estado === 'no-show').length
    const nsRate =
      filtered.length > 0
        ? Math.round((nsCount / filtered.length) * 1000) / 10
        : 0
    return { ingresos, nsCount, nsRate }
  }, [filtered])

  return { filtered, stats, loading, error, refetch }
}
