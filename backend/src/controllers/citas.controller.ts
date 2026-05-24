import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { Op } from 'sequelize'
import Cita from '../models/Cita'
import Horario from '../models/Horario'
import Servicio from '../models/Servicio'
import Cliente from '../models/Cliente'

const EstadoSchema = z.object({
  estado: z.enum(['confirmada', 'pendiente', 'cancelada', 'completada', 'bloqueado', 'no-show']),
})

/** Mapea la cita con sus relaciones al DTO del frontend */
function citaToDTO(cita: any): object {
  const horario = cita.horario ?? {}
  const servicio = horario.servicio ?? {}
  const cliente = cita.cliente ?? {}

  return {
    id: cita.id,
    fecha: horario.fecha ?? '',
    hora: horario.horaInicio ?? '',
    duracion: servicio.duracion ?? 0,
    cliente: `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim(),
    telefono: cliente.celular ?? '',
    servicio: servicio.nombre ?? '',
    precio: parseFloat(cita.precio) || 0,
    estado: cita.estado,
  }
}

/** Encuentra el idBarbero de una cita a través de su horario → servicio */
async function citaBelongsToBarbero(idCita: string, idBarbero: string): Promise<Cita | null> {
  const cita = await Cita.findByPk(idCita, {
    include: [
      {
        model: Horario,
        as: 'horario',
        include: [
          {
            model: Servicio,
            as: 'servicio',
            where: { idBarbero },
          },
        ],
      },
      { model: Cliente, as: 'cliente' },
    ],
  })
  return cita
}

export async function listCitas(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idBarbero = req.user!.idBarbero!
    const { fecha, desde, hasta } = req.query as Record<string, string>

    // Filtro por fecha o rango
    const fechaWhere: any = {}
    if (fecha) {
      fechaWhere.fecha = fecha
    } else if (desde && hasta) {
      fechaWhere.fecha = { [Op.between]: [desde, hasta] }
    }

    const citas = await Cita.findAll({
      include: [
        {
          model: Horario,
          as: 'horario',
          where: fechaWhere,
          include: [
            {
              model: Servicio,
              as: 'servicio',
              where: { idBarbero },
            },
          ],
        },
        { model: Cliente, as: 'cliente' },
      ],
      order: [[{ model: Horario, as: 'horario' }, 'fecha', 'ASC'],
              [{ model: Horario, as: 'horario' }, 'horaInicio', 'ASC']],
    })

    res.json(citas.map(citaToDTO))
  } catch (err) {
    next(err)
  }
}

export async function getCita(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idBarbero = req.user!.idBarbero!
    const cita = await citaBelongsToBarbero(String(req.params.id), idBarbero)
    if (!cita) {
      res.status(404).json({ error: 'Cita no encontrada' })
      return
    }
    res.json(citaToDTO(cita))
  } catch (err) {
    next(err)
  }
}

export async function updateEstadoCita(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idBarbero = req.user!.idBarbero!
    const cita = await citaBelongsToBarbero(String(req.params.id), idBarbero)
    if (!cita) {
      res.status(404).json({ error: 'Cita no encontrada' })
      return
    }
    const { estado } = EstadoSchema.parse(req.body)
    await cita.update({ estado })
    res.json(citaToDTO(cita))
  } catch (err) {
    next(err)
  }
}
