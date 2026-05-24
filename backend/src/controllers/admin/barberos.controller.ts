import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import Barbero from '../../models/Barbero'
import { Op, fn, col, literal } from 'sequelize'

const PRECIOS_PLAN: Record<string, number> = {
  solo: 49000,
  pro: 99000,
  estudio: 199000,
}

function barberoToDTO(b: Barbero) {
  const nombreCompleto = `${b.nombres} ${b.apellidos}`
  const mrr = PRECIOS_PLAN[b.plan ?? 'solo'] ?? 0
  const cMax = b.citasMaximo ?? null
  const uso = cMax ? Math.min(100, Math.round(((b.citasMes ?? 0) / cMax) * 100)) : 0

  return {
    id: b.id,
    nombre: nombreCompleto,
    barberia: b.barberia ?? nombreCompleto,
    ciudad: b.ciudad ?? '—',
    plan: b.plan ?? 'solo',
    estado: b.estadoSuscripcion ?? 'trial',
    alta: b.alta ?? b.createdAt?.toISOString().split('T')[0] ?? '',
    proxCobro: b.proxCobro ?? '—',
    citasMes: b.citasMes ?? 0,
    citasMaximo: cMax,
    mrr,
    uso,
    lastSeen: b.updatedAt?.toISOString().split('T')[0] ?? '',
  }
}

const BarberoUpdateSchema = z.object({
  nombres: z.string().optional(),
  apellidos: z.string().optional(),
  barberia: z.string().optional(),
  ciudad: z.string().optional(),
  plan: z.enum(['solo', 'pro', 'estudio']).optional(),
  estadoSuscripcion: z.enum(['activa', 'trial', 'morosa', 'cancelada']).optional(),
  alta: z.string().optional(),
  proxCobro: z.string().optional(),
  citasMaximo: z.number().nullable().optional(),
  activo: z.boolean().optional(),
}).partial()

export async function listBarberos(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const barberos = await Barbero.findAll({ order: [['createdAt', 'DESC']] })
    res.json(barberos.map(barberoToDTO))
  } catch (err) {
    next(err)
  }
}

export async function getBarberoById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const b = await Barbero.findByPk(String(req.params.id))
    if (!b) {
      res.status(404).json({ error: 'Barbero no encontrado' })
      return
    }
    res.json(barberoToDTO(b))
  } catch (err) {
    next(err)
  }
}

export async function updateBarbero(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const b = await Barbero.findByPk(String(req.params.id))
    if (!b) {
      res.status(404).json({ error: 'Barbero no encontrado' })
      return
    }
    const parsed = BarberoUpdateSchema.parse(req.body)
    await b.update(parsed)
    res.json(barberoToDTO(b))
  } catch (err) {
    next(err)
  }
}
