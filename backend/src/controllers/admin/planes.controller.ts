import { Request, Response, NextFunction } from 'express'
import Plan from '../../models/Plan'

export async function listPlanes(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const planes = await Plan.findAll()

    // Mapeamos al formato que espera el frontend (incluye color y limites)
    const planesDTO = planes.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      color: p.id === 'solo'
        ? 'var(--accent)'
        : p.id === 'pro'
        ? '#7c3aed'
        : '#0ea5e9',
      limites: p.citasMaximo
        ? `${p.citasMaximo} citas/mes`
        : 'Citas ilimitadas',
      features: p.features,
    }))

    res.json(planesDTO)
  } catch (err) {
    next(err)
  }
}
