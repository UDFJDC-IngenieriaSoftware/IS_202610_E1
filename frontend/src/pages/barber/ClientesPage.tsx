/**
 * ClientesPage — /panel/clientes
 *
 * Lista de clientes del barbero con búsqueda debounced,
 * estadísticas resumen y modal de perfil / edición.
 */
import { useState, useMemo, memo, useCallback } from 'react'
import { Topbar }        from '../../components/organisms/Topbar'
import { Card }          from '../../components/organisms/Card'
import { ClienteModal }  from '../../components/organisms/ClienteModal'
import { Stat }          from '../../components/molecules/Stat'
import { SearchInput }   from '../../components/molecules/SearchInput'
import { Icon }          from '../../components/atoms/Icon'
import { useClientes }   from '../../hooks/useClientes'
import { useDebounce }   from '../../hooks/useDebounce'
import { updateCliente } from '../../services/clientes.service'
import { fmtFechaCorta } from '../../utils/format'
import type { ClienteConStats } from '../../types'

/* ── Fila memoizada ──────────────────────────────────────────────────── */
const ClienteRow = memo(function ClienteRow({
  cliente,
  onOpen,
}: {
  cliente: ClienteConStats
  onOpen: (c: ClienteConStats) => void
}) {
  return (
    <tr
      className="row--clickable"
      onClick={() => onOpen(cliente)}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(cliente)}
    >
      <td>
        <div className="cell-cliente">
          <div className="mini-avatar">{cliente.nombres[0]}{cliente.apellidos[0]}</div>
          <div>
            <div className="strong">{cliente.nombres} {cliente.apellidos}</div>
            <div className="muted small">{cliente.email}</div>
          </div>
        </div>
      </td>
      <td className="muted">{cliente.celular}</td>
      <td className="num">{cliente.totalCitas}</td>
      <td className="muted">{cliente.ultimaVisita ? fmtFechaCorta(cliente.ultimaVisita) : '—'}</td>
      <td className="muted small">{cliente.servicioFrecuente ?? '—'}</td>
      <td><Icon name="chevron_right" size={14} /></td>
    </tr>
  )
})

/* ── Componente principal ─────────────────────────────────────────────── */
export function ClientesPage() {
  const [rawBusqueda, setRawBusqueda] = useState('')
  const busqueda = useDebounce(rawBusqueda, 250)

  const { data, loading, refetch } = useClientes(busqueda || undefined)
  const clientes = data ?? []

  const [clienteAbierto, setClienteAbierto] = useState<ClienteConStats | null>(null)

  /* Stats */
  const stats = useMemo(() => {
    const recurrentes = clientes.filter((c) => c.totalCitas > 1).length
    const hoy = new Date().toISOString().split('T')[0].slice(0, 7) // yyyy-mm
    const nuevos = clientes.filter((c) => c.ultimaVisita?.startsWith(hoy)).length
    return { total: clientes.length, recurrentes, nuevos }
  }, [clientes])

  const handleOpen  = useCallback((c: ClienteConStats) => setClienteAbierto(c), [])
  const handleClose = useCallback(() => setClienteAbierto(null), [])

  const handleSave = useCallback(async (
    id: string,
    datos: Partial<Pick<ClienteConStats, 'nombres' | 'apellidos' | 'email'>>,
  ) => {
    await updateCliente(id, datos)
    refetch()
    setClienteAbierto((prev) => (prev?.id === id ? { ...prev, ...datos } : prev))
  }, [refetch])

  if (loading && clientes.length === 0) {
    return (
      <div className="page">
        <div className="page-body" aria-live="polite" aria-busy="true">
          <p style={{ color: 'var(--muted)', padding: 32 }}>Cargando clientes…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Topbar
        title="Clientes"
        subtitle="Personas que han reservado contigo"
      />

      <div className="page-body">
        {/* Stats */}
        <div className="stat-row stat-row--3">
          <Stat label="Total clientes" value={String(stats.total)} sub="Con al menos una cita" />
          <Stat label="Recurrentes" value={String(stats.recurrentes)} sub="Más de una visita" />
          <Stat label="Activos este mes" value={String(stats.nuevos)} sub="Con visita en el mes actual" />
        </div>

        {/* Tabla */}
        <Card
          title={
            <SearchInput
              value={rawBusqueda}
              onChange={setRawBusqueda}
              placeholder="Buscar por nombre, celular o email…"
              inline
            />
          }
          flush
        >
          <table className="table table--clientes" aria-label="Lista de clientes">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Celular</th>
                <th className="num">Citas</th>
                <th>Última visita</th>
                <th>Servicio frecuente</th>
                <th aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <ClienteRow key={c.id} cliente={c} onOpen={handleOpen} />
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                    {rawBusqueda
                      ? 'No se encontraron clientes con esa búsqueda.'
                      : 'Aún no tienes clientes registrados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="table-foot">
            <span className="muted">
              {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
              {rawBusqueda ? ` · búsqueda: "${rawBusqueda}"` : ''}
            </span>
          </div>
        </Card>
      </div>

      {clienteAbierto && (
        <ClienteModal
          cliente={clienteAbierto}
          onClose={handleClose}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
