import { Router } from 'express'
import { listBarberos, getBarberoById, updateBarbero } from '../controllers/admin/barberos.controller'
import { listPlanes } from '../controllers/admin/planes.controller'
import { getMetricas } from '../controllers/admin/metricas.controller'
import { listPagos, updateEstadoPago } from '../controllers/admin/pagos.controller'

const router = Router()

// Barberos
router.get('/barberos', listBarberos)
router.get('/barberos/:id', getBarberoById)
router.patch('/barberos/:id', updateBarbero)

// Planes
router.get('/planes', listPlanes)

// Métricas
router.get('/metricas', getMetricas)

// Pagos de suscripción
router.get('/pagos', listPagos)
router.patch('/pagos/:id', updateEstadoPago)

export default router
