import { Transaction } from "sequelize";
import { sequelize, Cita, Cliente, Horario, Pago, Servicio, Barbero } from "../models";
import { HttpError } from "../utils/http";
import { AvailabilityService, fromMinutes } from "./availability.service";
import { notificationService } from "./notification.service";
import logger from "../utils/logger";

export interface CreateBookingInput {
  idServicio: string;
  fecha: string;
  hora: string;
  cliente: {
    nombres: string;
    apellidos: string;
    celular: string;
    email: string;
  };
}

const ACTIVE_STATES = ["pendiente", "confirmada"];

function minutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function serializeBooking(booking: Cita): Record<string, unknown> {
  const raw = booking.toJSON() as any;
  return {
    id: raw.id,
    fecha: raw.horario.fecha,
    hora: raw.horario.horaInicio.slice(0, 5),
    duracion: raw.horario.servicio.duracion,
    cliente: `${raw.cliente.nombres} ${raw.cliente.apellidos}`.trim(),
    telefono: raw.cliente.celular,
    servicio: raw.horario.servicio.nombre,
    precio: Number(raw.precio),
    estado: raw.estado,
  };
}

export class BookingService {
  private readonly availability = new AvailabilityService();

  async listForBarber(
    idBarbero: string,
    filters: { fecha?: string; desde?: string; hasta?: string } = {},
  ): Promise<Cita[]> {
    const scheduleWhere: Record<string, unknown> = {};
    if (filters.fecha) scheduleWhere.fecha = filters.fecha;
    if (filters.desde && filters.hasta) {
      const { Op } = await import("sequelize");
      scheduleWhere.fecha = { [Op.between]: [filters.desde, filters.hasta] };
    }
    return Cita.findAll({
      include: [
        { model: Cliente, as: "cliente", required: true },
        {
          model: Horario,
          as: "horario",
          required: true,
          where: scheduleWhere,
          include: [
            {
              model: Servicio,
              as: "servicio",
              required: true,
              where: { idBarbero },
            },
          ],
        },
      ],
      order: [[{ model: Horario, as: "horario" }, "fecha", "DESC"]],
    });
  }

  async getOwned(id: string, idBarbero: string): Promise<Cita> {
    const booking = await Cita.findOne({
      where: { id },
      include: [
        { model: Cliente, as: "cliente", required: true },
        {
          model: Horario,
          as: "horario",
          required: true,
          include: [
            {
              model: Servicio,
              as: "servicio",
              required: true,
              where: { idBarbero },
            },
          ],
        },
      ],
    });
    if (!booking) throw new HttpError(404, "Cita no encontrada");
    return booking;
  }

  async create(input: CreateBookingInput): Promise<{ booking: Cita; payment: Pago }> {
    return sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async (transaction) => {
        const service = await Servicio.findOne({
          where: { id: input.idServicio, activo: true },
          transaction,
        });
        if (!service) throw new HttpError(404, "Servicio no encontrado");
        const available = await this.availability.isSlotAvailable(
          service,
          input.fecha,
          input.hora,
          transaction,
        );
        if (!available) throw new HttpError(409, "El horario ya no esta disponible");

        const [customer] = await Cliente.findOrCreate({
          where: { celular: input.cliente.celular },
          defaults: input.cliente,
          transaction,
        });
        const slot = await Horario.create(
          {
            fecha: input.fecha,
            horaInicio: `${input.hora}:00`,
            horaFin: `${fromMinutes(minutes(input.hora) + service.duracion)}:00`,
            estado: "reservado",
            idServicio: service.id,
          },
          { transaction },
        );
        const booking = await Cita.create(
          {
            estado: "pendiente",
            precio: service.precio,
            idHorario: slot.id,
            idCliente: customer.id,
          },
          { transaction },
        );
        const payment = await Pago.create(
          {
            idCita: booking.id,
            monto: Math.round(service.precio * 0.5),
            estado: "pendiente",
            referencia: `MITURNO-${booking.id}`,
          },
          { transaction },
        );
        const populated = await Cita.findByPk(booking.id, {
          include: [
            { model: Cliente, as: "cliente", required: true },
            {
              model: Horario,
              as: "horario",
              required: true,
              include: [{ model: Servicio, as: "servicio", required: true }],
            },
          ],
          transaction,
        });
        return { booking: populated!, payment };
      },
    );
  }

  async listForCliente(celular: string): Promise<Cita[]> {
    const { Op } = await import("sequelize");
    const cliente = await Cliente.findOne({ where: { celular } });
    if (!cliente) return [];
    return Cita.findAll({
      where: { idCliente: cliente.id, estado: { [Op.in]: ["confirmada", "pendiente"] } },
      include: [
        {
          model: Horario,
          as: "horario",
          required: true,
          include: [{ model: Servicio, as: "servicio", required: true }],
        },
      ],
      order: [[{ model: Horario, as: "horario" }, "fecha", "ASC"]],
    });
  }

  async reschedule(citaId: string, newFecha: string, newHora: string): Promise<Cita> {
    return sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async (t) => {
        const booking = (await Cita.findByPk(citaId, {
          include: [
            {
              model: Horario,
              as: "horario",
              required: true,
              include: [{ model: Servicio, as: "servicio", required: true }],
            },
          ],
          transaction: t,
        })) as any;
        if (!booking) throw new HttpError(404, "Cita no encontrada");

        const service: Servicio = booking.horario.servicio;
        const available = await this.availability.isSlotAvailable(service, newFecha, newHora, t);
        if (!available) throw new HttpError(409, "El horario ya no está disponible");

        await Horario.update(
          { estado: "disponible" },
          { where: { id: booking.idHorario }, transaction: t },
        );

        const newSlot = await Horario.create(
          {
            fecha: newFecha,
            horaInicio: `${newHora}:00`,
            horaFin: `${fromMinutes(minutes(newHora) + service.duracion)}:00`,
            estado: "reservado",
            idServicio: service.id,
          },
          { transaction: t },
        );

        await booking.update({ idHorario: newSlot.id }, { transaction: t });
        return booking;
      },
    );
  }

  async updateStatus(id: string, idBarbero: string, estado: string): Promise<Cita> {
    if (!["pendiente", "confirmada", "cancelada", "completada", "no-show"].includes(estado)) {
      throw new HttpError(400, "Estado de cita invalido");
    }
    const booking = await this.getOwned(id, idBarbero);
    if (!ACTIVE_STATES.includes(booking.estado) && estado !== booking.estado) {
      throw new HttpError(409, "La cita ya esta cerrada");
    }
    await booking.update({ estado });
    if (estado === "cancelada") {
      await Horario.update({ estado: "disponible" }, { where: { id: booking.idHorario } });

      // Send cancellation notification
      try {
        const cliente = await Cliente.findByPk(booking.idCliente);
        const horario = (await Horario.findByPk(booking.idHorario, {
          include: [{ model: Servicio, as: "servicio", required: false }],
        })) as any;

        if (cliente && horario && horario.servicio) {
          const barbero = await Barbero.findByPk(horario.servicio.idBarbero);
          const barberName = barbero
            ? `${barbero.nombres} ${barbero.apellidos}`.trim()
            : "Barbero";

          const dateTime = `${horario.fecha} ${horario.horaInicio.slice(0, 5)}`;
          await notificationService.sendCancellation({
            customerName: `${cliente.nombres} ${cliente.apellidos}`.trim(),
            customerPhone: cliente.celular,
            barberName,
            serviceName: horario.servicio.nombre,
            dateTime,
            bookingId: booking.id as any,
          });
        }
      } catch (error) {
        logger.error("Error sending cancellation notification", { error: String(error) });
      }
    }
    return this.getOwned(id, idBarbero);
  }
}
