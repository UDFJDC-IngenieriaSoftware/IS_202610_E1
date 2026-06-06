import type { PagoBooking } from '../../types'

export const CITA_PAGOS_MOCK: ReadonlyArray<PagoBooking> = [
  { id: 'cp001', citaId: 'c001', monto: 12500, estado: 'exitoso',   referencia: 'miturno-c001-1717780000', fecha: '2026-06-15', cliente: 'Juan García',     servicio: 'Corte clásico'  },
  { id: 'cp002', citaId: 'c002', monto: 20000, estado: 'exitoso',   referencia: 'miturno-c002-1717866400', fecha: '2026-06-14', cliente: 'Ana Ruiz',        servicio: 'Barba perfilada' },
  { id: 'cp003', citaId: 'c003', monto: 12500, estado: 'pendiente', referencia: 'miturno-c003-1717952800', fecha: '2026-06-13', cliente: 'Luis Martínez',   servicio: 'Corte clásico'  },
  { id: 'cp004', citaId: 'c004', monto: 22500, estado: 'exitoso',   referencia: 'miturno-c004-1718039200', fecha: '2026-06-12', cliente: 'María López',     servicio: 'Corte + barba'  },
  { id: 'cp005', citaId: 'c005', monto: 12500, estado: 'fallido',   referencia: 'miturno-c005-1718125600', fecha: '2026-06-11', cliente: 'Carlos Vásquez',  servicio: 'Corte clásico'  },
  { id: 'cp006', citaId: 'c006', monto: 20000, estado: 'exitoso',   referencia: 'miturno-c006-1718212000', fecha: '2026-06-10', cliente: 'Pedro Salinas',   servicio: 'Barba perfilada' },
  { id: 'cp007', citaId: 'c007', monto: 12500, estado: 'exitoso',   referencia: 'miturno-c007-1718298400', fecha: '2026-06-09', cliente: 'Sofía Herrera',   servicio: 'Corte clásico'  },
  { id: 'cp008', citaId: 'c008', monto: 22500, estado: 'exitoso',   referencia: 'miturno-c008-1718384800', fecha: '2026-06-08', cliente: 'Andrés Morales',  servicio: 'Corte + barba'  },
]
