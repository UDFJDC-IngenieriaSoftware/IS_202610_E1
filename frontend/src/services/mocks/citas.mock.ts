import type { Cita } from '../../types'

export const CITAS_MOCK: ReadonlyArray<Cita> = [
  // ── HOY 2026-05-08 (viernes) ─────────────────────────────────────────────
  { id: 'c01', fecha: '2026-05-08', hora: '09:00', duracion: 30, cliente: 'Camilo Restrepo',  telefono: '+57 312 445 7821', servicio: 'Corte clásico',      precio: 28000, estado: 'completada' },
  { id: 'c02', fecha: '2026-05-08', hora: '09:30', duracion: 60, cliente: 'Daniel Ospina',    telefono: '+57 318 992 3344', servicio: 'Corte + barba',      precio: 45000, estado: 'completada' },
  { id: 'c03', fecha: '2026-05-08', hora: '10:30', duracion: 45, cliente: 'Sebastián Gómez',  telefono: '+57 301 778 1290', servicio: 'Corte fade',         precio: 35000, estado: 'completada' },
  { id: 'c04', fecha: '2026-05-08', hora: '11:30', duracion: 30, cliente: 'Mateo Henao',      telefono: '+57 314 220 8855', servicio: 'Corte clásico',      precio: 28000, estado: 'confirmada' },
  { id: 'c05', fecha: '2026-05-08', hora: '12:00', duracion: 30, cliente: 'Juan David Cano',  telefono: '+57 320 661 4732', servicio: 'Arreglo de barba',   precio: 22000, estado: 'confirmada' },
  { id: 'c06', fecha: '2026-05-08', hora: '14:00', duracion: 60, cliente: 'Felipe Arango',    telefono: '+57 313 884 2210', servicio: 'Corte + barba',      precio: 45000, estado: 'confirmada' },
  { id: 'c07', fecha: '2026-05-08', hora: '15:00', duracion: 30, cliente: 'Cristian Patiño',  telefono: '+57 315 770 0021', servicio: 'Corte clásico',      precio: 28000, estado: 'pendiente'  },
  { id: 'c08', fecha: '2026-05-08', hora: '15:30', duracion: 45, cliente: 'Tomás Velásquez',  telefono: '+57 304 559 8810', servicio: 'Corte fade',         precio: 35000, estado: 'confirmada' },
  { id: 'c09', fecha: '2026-05-08', hora: '16:30', duracion: 60, cliente: 'Andrés Quintero',  telefono: '+57 316 998 2204', servicio: 'Diseño / freestyle', precio: 50000, estado: 'pendiente'  },
  { id: 'c10', fecha: '2026-05-08', hora: '17:30', duracion: 30, cliente: 'Sergio Lopera',    telefono: '+57 312 005 4471', servicio: 'Corte clásico',      precio: 28000, estado: 'confirmada' },
  { id: 'c11', fecha: '2026-05-08', hora: '18:00', duracion: 60, cliente: 'Nicolás Builes',   telefono: '+57 318 113 9920', servicio: 'Corte + barba',      precio: 45000, estado: 'confirmada' },
  // ── Semana anterior ──────────────────────────────────────────────────────
  { id: 'c20', fecha: '2026-05-04', hora: '10:00', duracion: 60, cliente: 'Esteban Ríos',     telefono: '+57 313 220 0011', servicio: 'Corte + barba',      precio: 45000, estado: 'completada' },
  { id: 'c21', fecha: '2026-05-04', hora: '14:00', duracion: 30, cliente: 'Pablo Zuluaga',    telefono: '+57 314 661 2210', servicio: 'Corte clásico',      precio: 28000, estado: 'completada' },
  { id: 'c22', fecha: '2026-05-04', hora: '16:00', duracion: 45, cliente: 'Julián Mesa',      telefono: '+57 312 887 9911', servicio: 'Corte fade',         precio: 35000, estado: 'cancelada'  },
  { id: 'c23', fecha: '2026-05-05', hora: '09:30', duracion: 30, cliente: 'Ricardo Tobón',    telefono: '+57 315 008 7723', servicio: 'Arreglo de barba',   precio: 22000, estado: 'completada' },
  { id: 'c24', fecha: '2026-05-05', hora: '11:00', duracion: 60, cliente: 'Iván Castaño',     telefono: '+57 304 119 2280', servicio: 'Corte + barba',      precio: 45000, estado: 'completada' },
  { id: 'c25', fecha: '2026-05-05', hora: '15:00', duracion: 30, cliente: 'Brian Cardona',    telefono: '+57 318 220 4419', servicio: 'Corte clásico',      precio: 28000, estado: 'no-show'    },
  { id: 'c26', fecha: '2026-05-06', hora: '10:00', duracion: 45, cliente: 'Diego Marín',      telefono: '+57 313 770 0192', servicio: 'Corte fade',         precio: 35000, estado: 'completada' },
  { id: 'c27', fecha: '2026-05-06', hora: '14:30', duracion: 60, cliente: 'Óscar Bedoya',     telefono: '+57 320 884 3320', servicio: 'Diseño / freestyle', precio: 50000, estado: 'completada' },
  { id: 'c28', fecha: '2026-05-07', hora: '09:00', duracion: 30, cliente: 'Carlos Agudelo',   telefono: '+57 314 119 8820', servicio: 'Corte clásico',      precio: 28000, estado: 'completada' },
  { id: 'c29', fecha: '2026-05-07', hora: '11:00', duracion: 60, cliente: 'Mauricio Vélez',   telefono: '+57 313 002 7780', servicio: 'Corte + barba',      precio: 45000, estado: 'completada' },
  { id: 'c30', fecha: '2026-05-07', hora: '16:00', duracion: 45, cliente: 'Stiven Loaiza',    telefono: '+57 318 661 0044', servicio: 'Corte fade',         precio: 35000, estado: 'completada' },
  { id: 'c31', fecha: '2026-05-07', hora: '17:30', duracion: 30, cliente: 'Kevin Salazar',    telefono: '+57 304 778 1102', servicio: 'Corte clásico',      precio: 28000, estado: 'no-show'    },
  // ── Próxima semana ───────────────────────────────────────────────────────
  { id: 'c40', fecha: '2026-05-09', hora: '08:30', duracion: 30, cliente: 'Manuel Botero',    telefono: '+57 314 882 1109', servicio: 'Corte clásico',      precio: 28000, estado: 'confirmada' },
  { id: 'c41', fecha: '2026-05-09', hora: '10:00', duracion: 60, cliente: 'Felipe Arango',    telefono: '+57 313 884 2210', servicio: 'Corte + barba',      precio: 45000, estado: 'confirmada' },
  { id: 'c42', fecha: '2026-05-09', hora: '13:00', duracion: 45, cliente: 'David Restrepo',   telefono: '+57 318 449 0021', servicio: 'Corte fade',         precio: 35000, estado: 'pendiente'  },
  { id: 'c43', fecha: '2026-05-11', hora: '11:30', duracion: 30, cliente: 'Andrés Quintero',  telefono: '+57 316 998 2204', servicio: 'Corte clásico',      precio: 28000, estado: 'confirmada' },
]
