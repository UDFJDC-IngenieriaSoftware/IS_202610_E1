/**
 * Playwright globalTeardown — limpia los datos insertados por globalSetup.
 */
import { execFileSync } from 'child_process'
import path from 'path'

export default async function globalTeardown() {
  const backendDir = path.join(__dirname, '../../backend')
  const script     = path.join(backendDir, 'scripts/seed-e2e.js')

  execFileSync('node', [script, '--teardown'], {
    cwd:   backendDir,
    stdio: 'inherit',
    env:   { ...process.env, NODE_ENV: 'development' },
  })
}
