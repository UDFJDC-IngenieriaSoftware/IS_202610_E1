import { Router } from 'express'
import {
  listServicios,
  createServicio,
  updateServicio,
  deleteServicio,
} from '../controllers/servicios.controller'

const router = Router()

router.get('/', listServicios)
router.post('/', createServicio)
router.patch('/:id', updateServicio)
router.delete('/:id', deleteServicio)

export default router
