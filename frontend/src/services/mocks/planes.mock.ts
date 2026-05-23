import type { Plan } from '../../types'

export const PLANES_MOCK: ReadonlyArray<Plan> = [
  {
    id: 'solo',
    nombre: 'Solo',
    precio: 29000,
    color: 'var(--st-slate-fg)',
    limites: 'Hasta 100 citas/mes',
    features: ['Bot WhatsApp', 'Pagos PSE', 'Panel web', '100 citas/mes'],
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio: 59000,
    color: 'var(--accent)',
    limites: 'Citas ilimitadas',
    features: ['Todo de Solo', 'Citas ilimitadas', 'Recordatorios', 'Reportes', 'Soporte WhatsApp'],
  },
  {
    id: 'estudio',
    nombre: 'Estudio',
    precio: 99000,
    color: 'var(--ink)',
    limites: 'Hasta 4 barberos',
    features: ['Todo de Pro', 'Hasta 4 barberos', 'Agendas independientes', 'Vista de estudio', 'Soporte prioritario'],
  },
]
