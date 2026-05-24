/**
 * Router central — monta todas las rutas bajo /api
 *
 * Rutas públicas:
 *   POST /api/auth/login
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 *
 * Rutas de barbero (requieren sesión + rol=barbero):
 *   GET|POST|PATCH|DELETE /api/servicios
 *   GET|PATCH             /api/horario
 *   GET|POST|DELETE       /api/horario/dias-libres
 *   GET|PATCH             /api/citas
 *
 * Rutas de admin (requieren sesión + rol=admin):
 *   GET|PATCH             /api/admin/barberos
 *   GET                   /api/admin/planes
 *   GET                   /api/admin/metricas
 *   GET|PATCH             /api/admin/pagos
 */

import { Router } from 'express'
import authRoutes from './auth.routes'
import serviciosRoutes from './servicios.routes'
import horarioRoutes from './horario.routes'
import citasRoutes from './citas.routes'
import adminRoutes from './admin.routes'
import { getCurrentUser, authRequired } from '../middleware/auth'
import { requireRole } from '../middleware/roles'

const router = Router()

// ── Auth (público) ─────────────────────────────────────────────────────────
router.use('/auth', authRoutes)

// ── Scope barbero ──────────────────────────────────────────────────────────
const barberoMW = [getCurrentUser, authRequired, requireRole('barbero')]
router.use('/servicios', ...barberoMW, serviciosRoutes)
// Nota: dias-libres debe ir antes del PATCH /:idx para no colisionar
router.use('/horario', ...barberoMW, horarioRoutes)
router.use('/citas', ...barberoMW, citasRoutes)

// ── Scope admin ────────────────────────────────────────────────────────────
const adminMW = [getCurrentUser, authRequired, requireRole('admin')]
router.use('/admin', ...adminMW, adminRoutes)

export default router
