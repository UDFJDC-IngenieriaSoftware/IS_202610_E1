import { Op, Transaction } from "sequelize";
import { Cita, DiaLibre, Horario, HorarioDia, Servicio } from "../models";
import { HttpError } from "../utils/http";

export interface TimeSlot {
  time: string;
  available: boolean;
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

export function fromMinutes(value: number): string {
  const hours = String(Math.floor(value / 60)).padStart(2, "0");
  const minutes = String(value % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function overlaps(start: number, end: number, otherStart: number, otherEnd: number): boolean {
  return start < otherEnd && end > otherStart;
}

export class AvailabilityService {
  async getAvailableSlots(
    idBarbero: string,
    date: string,
    serviceDuration: number,
    transaction?: Transaction,
  ): Promise<TimeSlot[]> {
    const dayIndex = new Date(`${date}T00:00:00`).getDay();
    const schedule = await HorarioDia.findOne({
      where: { idBarbero, idx: dayIndex, activo: true },
      transaction,
    });
    if (!schedule) return [];
    const unavailable = await DiaLibre.findOne({ where: { idBarbero, fecha: date }, transaction });
    if (unavailable) return [];

    const appointments = await Horario.findAll({
      where: { fecha: date },
      include: [
        {
          model: Servicio,
          as: "servicio",
          required: true,
          where: { idBarbero },
        },
        {
          model: Cita,
          as: "cita",
          required: true,
          where: { estado: { [Op.notIn]: ["cancelada"] } },
        },
      ],
      transaction,
    });
    const busy = appointments.map((appointment) => ({
      start: toMinutes(appointment.horaInicio),
      end: toMinutes(appointment.horaFin),
    }));
    const start = toMinutes(schedule.inicio);
    const end = toMinutes(schedule.fin);
    const breakStart = schedule.descansoIni ? toMinutes(schedule.descansoIni) : undefined;
    const breakEnd = schedule.descansoFin ? toMinutes(schedule.descansoFin) : undefined;
    const slots: TimeSlot[] = [];
    for (let current = start; current + serviceDuration <= end; current += serviceDuration) {
      const slotEnd = current + serviceDuration;
      const isBreak =
        breakStart !== undefined &&
        breakEnd !== undefined &&
        overlaps(current, slotEnd, breakStart, breakEnd);
      const isBusy = busy.some((appointment) =>
        overlaps(current, slotEnd, appointment.start, appointment.end),
      );
      slots.push({ time: fromMinutes(current), available: !isBreak && !isBusy });
    }
    return slots;
  }

  async getForService(serviceId: string, date: string): Promise<TimeSlot[]> {
    const service = await Servicio.findOne({ where: { id: serviceId, activo: true } });
    if (!service) throw new HttpError(404, "Servicio no encontrado");
    return this.getAvailableSlots(service.idBarbero, date, service.duracion);
  }

  async isSlotAvailable(
    service: Servicio,
    date: string,
    startTime: string,
    transaction?: Transaction,
  ): Promise<boolean> {
    const slots = await this.getAvailableSlots(
      service.idBarbero,
      date,
      service.duracion,
      transaction,
    );
    return slots.some((slot) => slot.time === startTime && slot.available);
  }
}
