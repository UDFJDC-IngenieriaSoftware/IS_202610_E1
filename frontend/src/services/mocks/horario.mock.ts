import type { HorarioDia, DiaLibre } from '../../types'

export const HORARIO_MOCK: ReadonlyArray<HorarioDia> = [
  { dia: 'Lunes',     idx: 1, activo: true,  inicio: '09:00', fin: '19:00', descansoIni: '13:00', descansoFin: '14:00' },
  { dia: 'Martes',    idx: 2, activo: true,  inicio: '09:00', fin: '19:00', descansoIni: '13:00', descansoFin: '14:00' },
  { dia: 'Miércoles', idx: 3, activo: true,  inicio: '09:00', fin: '19:00', descansoIni: '13:00', descansoFin: '14:00' },
  { dia: 'Jueves',    idx: 4, activo: true,  inicio: '09:00', fin: '20:00', descansoIni: '13:00', descansoFin: '14:00' },
  { dia: 'Viernes',   idx: 5, activo: true,  inicio: '09:00', fin: '20:00', descansoIni: '13:00', descansoFin: '14:00' },
  { dia: 'Sábado',    idx: 6, activo: true,  inicio: '08:00', fin: '18:00', descansoIni: '12:30', descansoFin: '13:30' },
  { dia: 'Domingo',   idx: 0, activo: false, inicio: '10:00', fin: '14:00', descansoIni: '',       descansoFin: ''      },
]

export const DIAS_LIBRES_MOCK: ReadonlyArray<DiaLibre> = [
  { id: 'd1', fecha: '2026-05-15', motivo: 'Día festivo'   },
  { id: 'd2', fecha: '2026-05-25', motivo: 'Capacitación'  },
  { id: 'd3', fecha: '2026-06-01', motivo: 'Vacaciones'    },
  { id: 'd4', fecha: '2026-06-02', motivo: 'Vacaciones'    },
]
