import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import Servicio from '../models/Servicio'

const ServicioSchema = z.object({
  nombre: z.string().min(1),
  duracion: z.number().int().positive(),
  precio: z.number().positive(),
  activo: z.boolean().optional().default(true),
  descripcion: z.string().optional().default(''),
})

const ServicioPatchSchema = ServicioSchema.partial()

/** Mapea instancia Sequelize → forma que espera el frontend */
function toDTO(s: Servicio) {
  return {
    id: s.id,
    nombre: s.nombre,
    duracion: s.duracion,
    precio: s.precio,
    activo: (s as any).activo ?? true,
    descripcion: s.descripcion ?? '',
  }
}

export async function listServicios(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idBarbero = req.user!.idBarbero!
    const where: any = { idBarbero }
    if (req.query.activo === 'true') where.activo = true
    const servicios = await Servicio.findAll({ where })
    res.json(servicios.map(toDTO))
  } catch (err) {
    next(err)
  }
}

export async function createServicio(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = ServicioSchema.parse(req.body)
    const idBarbero = req.user!.idBarbero!
    const svc = await Servicio.create({ ...parsed, idBarbero })
    res.status(201).json(toDTO(svc))
  } catch (err) {
    next(err)
  }
}

export async function updateServicio(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params
    const idBarbero = req.user!.idBarbero!
    const svc = await Servicio.findOne({ where: { id, idBarbero } })
    if (!svc) {
      res.status(404).json({ error: 'Servicio no encontrado' })
      return
    }
    const parsed = ServicioPatchSchema.parse(req.body)
    await svc.update(parsed)
    res.json(toDTO(svc))
  } catch (err) {
    next(err)
  }
}

export async function deleteServicio(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params
    const idBarbero = req.user!.idBarbero!
    const svc = await Servicio.findOne({ where: { id, idBarbero } })
    if (!svc) {
      res.status(404).json({ error: 'Servicio no encontrado' })
      return
    }
    await svc.destroy()
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
