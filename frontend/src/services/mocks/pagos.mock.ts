import type { Pago } from '../../types'

export const PAGOS_MOCK: ReadonlyArray<Pago> = [
  { id: 'p001', fecha: '2026-05-17', barberoId: 'b001', barbero: 'Andrés Mejía',     plan: 'pro',     monto: 59000, estado: 'exitoso',   metodo: 'PSE',     referencia: 'PSE-A82K-1198' },
  { id: 'p002', fecha: '2026-05-17', barberoId: 'b008', barbero: 'Sergio Lopera',    plan: 'pro',     monto: 59000, estado: 'exitoso',   metodo: 'PSE',     referencia: 'PSE-A82K-1199' },
  { id: 'p003', fecha: '2026-05-16', barberoId: 'b011', barbero: 'Kevin Salazar',    plan: 'pro',     monto: 59000, estado: 'exitoso',   metodo: 'Tarjeta', referencia: 'TC-9921-447'   },
  { id: 'p004', fecha: '2026-05-15', barberoId: 'b004', barbero: 'Mauricio Vélez',   plan: 'estudio', monto: 99000, estado: 'exitoso',   metodo: 'PSE',     referencia: 'PSE-A82K-1187' },
  { id: 'p005', fecha: '2026-05-15', barberoId: 'b007', barbero: 'Diego Marín',      plan: 'solo',    monto: 29000, estado: 'fallido',   metodo: 'PSE',     referencia: 'PSE-A82K-1180' },
  { id: 'p006', fecha: '2026-05-14', barberoId: 'b003', barbero: 'Sebastián Hoyos',  plan: 'pro',     monto: 59000, estado: 'exitoso',   metodo: 'PSE',     referencia: 'PSE-A82K-1176' },
  { id: 'p007', fecha: '2026-05-13', barberoId: 'b009', barbero: 'Esteban Ríos',     plan: 'estudio', monto: 99000, estado: 'exitoso',   metodo: 'PSE',     referencia: 'PSE-A82K-1171' },
  { id: 'p008', fecha: '2026-05-12', barberoId: 'b002', barbero: 'Juan Camilo Ríos', plan: 'solo',    monto: 29000, estado: 'exitoso',   metodo: 'Tarjeta', referencia: 'TC-9921-441'   },
  { id: 'p009', fecha: '2026-05-11', barberoId: 'b013', barbero: 'Ricardo Tobón',    plan: 'pro',     monto: 59000, estado: 'exitoso',   metodo: 'PSE',     referencia: 'PSE-A82K-1163' },
  { id: 'p010', fecha: '2026-05-10', barberoId: 'b006', barbero: 'Felipe Arango',    plan: 'solo',    monto: 29000, estado: 'exitoso',   metodo: 'PSE',     referencia: 'PSE-A82K-1158' },
  { id: 'p011', fecha: '2026-05-08', barberoId: 'b015', barbero: 'Cristian Patiño',  plan: 'estudio', monto: 99000, estado: 'pendiente', metodo: 'PSE',     referencia: 'PSE-A82K-1149' },
  { id: 'p012', fecha: '2026-05-07', barberoId: 'b014', barbero: 'Pablo Zuluaga',    plan: 'solo',    monto: 29000, estado: 'exitoso',   metodo: 'PSE',     referencia: 'PSE-A82K-1142' },
]
