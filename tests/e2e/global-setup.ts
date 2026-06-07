/**
 * Playwright globalSetup — inserta datos de prueba necesarios para los tests E2E.
 *
 * El seed del proyecto crea barberos, clientes, servicios y horarios,
 * pero NO citas. Sin citas, /api/clientes devuelve [] porque la ownership
 * se verifica: Cita → Horario → Servicio → idBarbero.
 *
 * Ejecuta el script seed-e2e.js en el contexto del backend (donde pg está instalado).
 */
import { execFileSync } from 'child_process'
import path from 'path'

export default async function globalSetup() {
  const backendDir = path.join(__dirname, '../../backend')
  const script     = path.join(backendDir, 'scripts/seed-e2e.js')

  execFileSync('node', [script], {
    cwd:   backendDir,
    stdio: 'inherit',
    env:   { ...process.env, NODE_ENV: 'development' },
  })
}
