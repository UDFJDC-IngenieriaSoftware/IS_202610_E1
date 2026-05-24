import { Router } from 'express'
import {
  getHorario,
  updateHorarioDia,
  getDiasLibres,
  addDiaLibre,
  removeDiaLibre,
} from '../controllers/horario.controller'

const router = Router()

router.get('/', getHorario)
router.patch('/:idx', updateHorarioDia)
router.get('/dias-libres', getDiasLibres)
router.post('/dias-libres', addDiaLibre)
router.delete('/dias-libres/:id', removeDiaLibre)

export default router
