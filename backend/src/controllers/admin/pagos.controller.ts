import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import PagoSuscripcion from '../../models/PagoSuscripcion'
import Barbero from '../../models/Barbero'

function pagoToDTO(p: PagoSuscripcion, b?: Barbero | null) {
  const nombre = b ? `${b.nombres} ${b.apellidos}` : p.idBarbero
  return {
    id: p.id,
    fecha: p.fecha,
    barberoId: p.idBarbero,
    barbero: nombre,
    plan: p.plan,
    monto: p.monto,
    estado: p.estado,
    metodo: p.metodo,
    referencia: p.referencia,
  }
}

const EstadoSchema = z.object({
  estado: z.enum(['exitoso', 'fallido', 'pendiente']),
})

export async function listPagos(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const where: any = {}
    if (req.query.barberoId) where.idBarbero = req.query.barberoId

    const pagos = await PagoSuscripcion.findAll({
      where,
      include: [{ model: Barbero, as: 'barbero' }],
      order: [['fecha', 'DESC']],
    })

    res.json(
      pagos.map((p: any) => pagoToDTO(p, p.barbero)),
    )
  } catch (err) {
    next(err)
  }
}

export async function updateEstadoPago(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pago = await PagoSuscripcion.findByPk(String(req.params.id), {
      include: [{ model: Barbero, as: 'barbero' }],
    })
    if (!pago) {
      res.status(404).json({ error: 'Pago no encontrado' })
      return
    }
    const { estado } = EstadoSchema.parse(req.body)
    await pago.update({ estado })
    res.json(pagoToDTO(pago, (pago as any).barbero))
  } catch (err) {
    next(err)
  }
}
