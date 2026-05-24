import { Router } from 'express'
import { listCitas, getCita, updateEstadoCita } from '../controllers/citas.controller'

const router = Router()

router.get('/', listCitas)
router.get('/:id', getCita)
router.patch('/:id', updateEstadoCita)

export default router
