import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import HorarioSemanal from '../models/HorarioSemanal'
import DiaLibre from '../models/DiaLibre'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function horarioToDTO(h: HorarioSemanal) {
  return {
    dia: DIAS[h.idx],
    idx: h.idx,
    activo: h.activo,
    inicio: h.inicio,
    fin: h.fin,
    descansoIni: h.descansoIni,
    descansoFin: h.descansoFin,
  }
}

const HorarioPatchSchema = z.object({
  activo: z.boolean().optional(),
  inicio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  fin: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  descansoIni: z.string().optional(),
  descansoFin: z.string().optional(),
})

const DiaLibreSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  motivo: z.string().default(''),
})

// ── Horario semanal ───────────────────────────────────────────────────────────

export async function getHorario(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idBarbero = req.user!.idBarbero!
    let registros = await HorarioSemanal.findAll({
      where: { idBarbero },
      order: [['idx', 'ASC']],
    })

    // Si no existe configuración aún, creamos la semana con defaults
    if (registros.length === 0) {
      const defaults = Array.from({ length: 7 }, (_, i) => ({
        idBarbero,
        idx: i,
        activo: i >= 1 && i <= 5, // L-V activos por defecto
        inicio: '09:00',
        fin: '18:00',
        descansoIni: '',
        descansoFin: '',
      }))
      registros = await HorarioSemanal.bulkCreate(defaults)
    }

    res.json(registros.map(horarioToDTO))
  } catch (err) {
    next(err)
  }
}

export async function updateHorarioDia(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idBarbero = req.user!.idBarbero!
    const idx = parseInt(String(req.params.idx), 10)
    if (isNaN(idx) || idx < 0 || idx > 6) {
      res.status(400).json({ error: 'idx inválido (0-6)' })
      return
    }
    const parsed = HorarioPatchSchema.parse(req.body)
    const [, [updated]] = await HorarioSemanal.update(parsed, {
      where: { idBarbero, idx },
      returning: true,
    })
    if (!updated) {
      res.status(404).json({ error: 'Día no encontrado' })
      return
    }
    res.json(horarioToDTO(updated))
  } catch (err) {
    next(err)
  }
}

// ── Días libres ───────────────────────────────────────────────────────────────

export async function getDiasLibres(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idBarbero = req.user!.idBarbero!
    const dias = await DiaLibre.findAll({ where: { idBarbero }, order: [['fecha', 'ASC']] })
    res.json(dias.map((d) => ({ id: d.id, fecha: d.fecha, motivo: d.motivo })))
  } catch (err) {
    next(err)
  }
}

export async function addDiaLibre(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idBarbero = req.user!.idBarbero!
    const parsed = DiaLibreSchema.parse(req.body)
    const dia = await DiaLibre.create({ idBarbero, ...parsed })
    res.status(201).json({ id: dia.id, fecha: dia.fecha, motivo: dia.motivo })
  } catch (err) {
    next(err)
  }
}

export async function removeDiaLibre(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idBarbero = req.user!.idBarbero!
    const { id } = req.params
    const dia = await DiaLibre.findOne({ where: { id, idBarbero } })
    if (!dia) {
      res.status(404).json({ error: 'Día libre no encontrado' })
      return
    }
    await dia.destroy()
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
