import { Request, Response, NextFunction } from 'express'
import { fn, col, literal, Op } from 'sequelize'
import Barbero from '../../models/Barbero'
import PagoSuscripcion from '../../models/PagoSuscripcion'

const PRECIOS_PLAN: Record<string, number> = {
  solo: 49000,
  pro: 99000,
  estudio: 199000,
}

export async function getMetricas(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const barberos = await Barbero.findAll()

    // MRR: suma del precio de plan de barberos activos
    const barberoActivos = barberos.filter(
      (b) => b.estadoSuscripcion === 'activa',
    )
    const mrr = barberoActivos.reduce(
      (acc, b) => acc + (PRECIOS_PLAN[b.plan ?? 'solo'] ?? 0),
      0,
    )
    const arr = mrr * 12

    const totalBarberos = barberos.length
    const trial = barberos.filter((b) => b.estadoSuscripcion === 'trial').length
    const cancelados = barberos.filter((b) => b.estadoSuscripcion === 'cancelada').length

    // Nuevos este mes
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)
    const nuevosMes = barberos.filter(
      (b) => b.createdAt && new Date(b.createdAt) >= inicioMes,
    ).length

    // Churn simplificado: cancelados / total
    const churnPct =
      totalBarberos > 0
        ? Math.round((cancelados / totalBarberos) * 100 * 10) / 10
        : 0

    // Conversión: activos / (trial + activos)
    const trialesYactivos = trial + barberoActivos.length
    const conversionPct =
      trialesYactivos > 0
        ? Math.round((barberoActivos.length / trialesYactivos) * 100)
        : 0

    const ticketProm =
      barberoActivos.length > 0
        ? Math.round(mrr / barberoActivos.length)
        : 0

    // Series de los últimos 6 meses (calculadas desde pagos de suscripción)
    const mesesSerie: string[] = []
    const mrrSerie: number[] = []
    const signupsSerie: number[] = []

    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mesLabel = d.toLocaleString('es-CO', { month: 'short' })
      mesesSerie.push(mesLabel)

      // MRR de ese mes: pagos exitosos en ese mes
      const inicio = new Date(d.getFullYear(), d.getMonth(), 1)
        .toISOString()
        .split('T')[0]
      const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]

      const pagos = await PagoSuscripcion.findAll({
        where: { estado: 'exitoso', fecha: { [Op.between]: [inicio, fin] } },
      })
      const mrrMes = pagos.reduce((acc, p) => acc + p.monto, 0)
      mrrSerie.push(mrrMes)

      // Signups en ese mes
      const signups = barberos.filter((b) => {
        if (!b.createdAt) return false
        const created = new Date(b.createdAt).toISOString().split('T')[0]
        return created >= inicio && created <= fin
      }).length
      signupsSerie.push(signups)
    }

    res.json({
      mrr,
      arr,
      totalBarberos,
      trial,
      cancelados,
      nuevosMes,
      churnPct,
      conversionPct,
      ticketProm,
      mrrSerie,
      mesesSerie,
      signupsSerie,
    })
  } catch (err) {
    next(err)
  }
}
