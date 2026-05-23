import type { Barbero, MetricasPlataforma } from '../../types'

export const BARBEROS_MOCK: ReadonlyArray<Barbero> = [
  { id: 'b001', nombre: 'Andrés Mejía',    barberia: 'Estudio Barbería Andrés',  ciudad: 'Medellín',     plan: 'pro',     estado: 'activa',    alta: '2025-08-12', proxCobro: '2026-06-12', citasMes: 187, citasMaximo: null, mrr: 59000, uso: 92, lastSeen: 'Hace 2 min'   },
  { id: 'b002', nombre: 'Juan Camilo Ríos', barberia: 'El Bigote Barbería',      ciudad: 'Bogotá',       plan: 'solo',    estado: 'activa',    alta: '2025-09-04', proxCobro: '2026-06-04', citasMes: 78,  citasMaximo: 100,  mrr: 29000, uso: 78, lastSeen: 'Hace 1 h'     },
  { id: 'b003', nombre: 'Sebastián Hoyos', barberia: 'Cuchilla Cl. 70',          ciudad: 'Bogotá',       plan: 'pro',     estado: 'activa',    alta: '2025-06-21', proxCobro: '2026-05-21', citasMes: 142, citasMaximo: null, mrr: 59000, uso: 86, lastSeen: 'Hace 4 h'     },
  { id: 'b004', nombre: 'Mauricio Vélez',  barberia: 'Mr. Hyde Barber',           ciudad: 'Medellín',     plan: 'estudio', estado: 'activa',    alta: '2025-04-08', proxCobro: '2026-06-08', citasMes: 412, citasMaximo: null, mrr: 99000, uso: 95, lastSeen: 'Hace 12 min'  },
  { id: 'b005', nombre: 'Carlos Agudelo',  barberia: 'Don Pedro Barber Co.',      ciudad: 'Cali',         plan: 'pro',     estado: 'trial',     alta: '2026-05-02', proxCobro: '2026-05-16', citasMes: 12,  citasMaximo: null, mrr: 0,     uso: 24, lastSeen: 'Hace 30 min'  },
  { id: 'b006', nombre: 'Felipe Arango',   barberia: 'Barba & Co.',               ciudad: 'Barranquilla', plan: 'solo',    estado: 'activa',    alta: '2025-11-15', proxCobro: '2026-06-15', citasMes: 56,  citasMaximo: 100,  mrr: 29000, uso: 56, lastSeen: 'Hace 1 día'   },
  { id: 'b007', nombre: 'Diego Marín',     barberia: 'Cortes Mr. D',              ciudad: 'Bucaramanga',  plan: 'solo',    estado: 'morosa',    alta: '2025-07-30', proxCobro: '2026-05-05', citasMes: 68,  citasMaximo: 100,  mrr: 29000, uso: 68, lastSeen: 'Hace 3 días'  },
  { id: 'b008', nombre: 'Sergio Lopera',   barberia: 'Klan Barber',               ciudad: 'Medellín',     plan: 'pro',     estado: 'activa',    alta: '2025-10-19', proxCobro: '2026-06-19', citasMes: 134, citasMaximo: null, mrr: 59000, uso: 80, lastSeen: 'Hace 5 min'   },
  { id: 'b009', nombre: 'Esteban Ríos',    barberia: 'Atelier Masculino',         ciudad: 'Bogotá',       plan: 'estudio', estado: 'activa',    alta: '2025-03-11', proxCobro: '2026-06-11', citasMes: 387, citasMaximo: null, mrr: 99000, uso: 88, lastSeen: 'Hace 25 min'  },
  { id: 'b010', nombre: 'Nicolás Builes',  barberia: 'La Cueva del Corte',        ciudad: 'Cali',         plan: 'solo',    estado: 'trial',     alta: '2026-05-09', proxCobro: '2026-05-23', citasMes: 6,   citasMaximo: null, mrr: 0,     uso: 12, lastSeen: 'Hace 2 días'  },
  { id: 'b011', nombre: 'Kevin Salazar',   barberia: 'Lobo Barbershop',           ciudad: 'Medellín',     plan: 'pro',     estado: 'activa',    alta: '2025-05-28', proxCobro: '2026-05-28', citasMes: 119, citasMaximo: null, mrr: 59000, uso: 76, lastSeen: 'Hace 8 h'     },
  { id: 'b012', nombre: 'Tomás Velásquez', barberia: 'Norte Barbería',            ciudad: 'Cartagena',    plan: 'solo',    estado: 'cancelada', alta: '2025-09-22', proxCobro: '—',          citasMes: 0,   citasMaximo: 100,  mrr: 0,     uso: 0,  lastSeen: 'Hace 18 días' },
  { id: 'b013', nombre: 'Ricardo Tobón',   barberia: 'Estudio R',                 ciudad: 'Medellín',     plan: 'pro',     estado: 'activa',    alta: '2025-12-04', proxCobro: '2026-06-04', citasMes: 91,  citasMaximo: null, mrr: 59000, uso: 64, lastSeen: 'Hace 1 h'     },
  { id: 'b014', nombre: 'Pablo Zuluaga',   barberia: 'Capilla Barber',            ciudad: 'Bogotá',       plan: 'solo',    estado: 'activa',    alta: '2026-02-17', proxCobro: '2026-06-17', citasMes: 44,  citasMaximo: 100,  mrr: 29000, uso: 44, lastSeen: 'Hace 6 h'     },
  { id: 'b015', nombre: 'Cristian Patiño', barberia: 'Patiño & Hijos',            ciudad: 'Pereira',      plan: 'estudio', estado: 'morosa',    alta: '2025-08-30', proxCobro: '2026-05-08', citasMes: 0,   citasMaximo: null, mrr: 99000, uso: 22, lastSeen: 'Hace 2 días'  },
]

export const METRICAS_MOCK: MetricasPlataforma = {
  mrr: 826000,
  arr: 9912000,
  totalBarberos: 13,
  trial: 2,
  cancelados: 1,
  nuevosMes: 4,
  churnPct: 2.1,
  conversionPct: 67,
  ticketProm: 51625,
  mrrSerie:     [380, 412, 458, 502, 548, 612, 656, 698, 738, 776, 803, 826],
  mesesSerie:   ['Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May'],
  signupsSerie: [3, 5, 4, 6, 5, 8, 6, 7, 9, 5, 4, 4],
}
