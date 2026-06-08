import type { Servicio } from '../../types'

export const SERVICIOS_MOCK: ReadonlyArray<Servicio> = [
  { id: 's1', nombre: 'Corte clásico',      duracion: 30, precio: 28000, activo: true,  descripcion: 'Corte tradicional con tijera y máquina'    },
  { id: 's2', nombre: 'Corte + barba',      duracion: 60, precio: 45000, activo: true,  descripcion: 'Combo completo con perfilado de barba'      },
  { id: 's3', nombre: 'Arreglo de barba',   duracion: 30, precio: 22000, activo: true,  descripcion: 'Perfilado, recorte y toalla caliente'       },
  { id: 's4', nombre: 'Corte fade',         duracion: 45, precio: 35000, activo: true,  descripcion: 'Degradado a piel o medio fade'              },
  { id: 's5', nombre: 'Diseño / freestyle', duracion: 60, precio: 50000, activo: true,  descripcion: 'Diseño personalizado con cuchilla'          },
  { id: 's6', nombre: 'Corte niño',         duracion: 30, precio: 20000, activo: true,  descripcion: 'Menores de 12 años'                         },
  { id: 's7', nombre: 'Cejas',              duracion: 15, precio: 10000, activo: false, descripcion: 'Perfilado con cera o cuchilla'              },
]
