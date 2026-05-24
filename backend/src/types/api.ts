/**
 * Tipos compartidos del contrato REST (espejo de frontend/src/types/domain.ts).
 * El backend los usa para tipar las respuestas JSON de los controllers.
 */

export interface BarberoPerfil {
  id: string
  nombre: string
  barberia: string
  ciudad: string
  inicial: string
}
