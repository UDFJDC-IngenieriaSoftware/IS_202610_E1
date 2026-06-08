import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { DiaLibre, HorarioDia } from "../models";
import { DEFAULT_SCHEDULE } from "../services/auth.service";
import { HttpError, isoDate, optionalString, requiredString } from "../utils/http";

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Mi\u00e9rcoles",
  "Jueves",
  "Viernes",
  "S\u00e1bado",
];

function time(value: unknown, field: string, allowEmpty = false): string {
  if (allowEmpty && (value === "" || value === undefined)) return "";
  const parsed = requiredString(value, field);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(parsed)) {
    throw new HttpError(400, `${field} debe tener formato HH:MM`);
  }
  return parsed;
}

function validateTimes(data: {
  inicio: string;
  fin: string;
  descansoIni: string;
  descansoFin: string;
}): void {
  if (data.inicio >= data.fin) {
    throw new HttpError(400, "La hora inicial debe ser anterior a la hora final");
  }
  if (Boolean(data.descansoIni) !== Boolean(data.descansoFin)) {
    throw new HttpError(400, "El descanso requiere hora inicial y final");
  }
  if (
    data.descansoIni &&
    (data.descansoIni >= data.descansoFin ||
      data.descansoIni < data.inicio ||
      data.descansoFin > data.fin)
  ) {
    throw new HttpError(400, "El descanso debe estar dentro del horario de trabajo");
  }
}

function serializeSchedule(schedule: HorarioDia) {
  return {
    dia: DAY_NAMES[schedule.idx],
    idx: schedule.idx,
    activo: schedule.activo,
    inicio: schedule.inicio,
    fin: schedule.fin,
    descansoIni: schedule.descansoIni,
    descansoFin: schedule.descansoFin,
  };
}

async function ensureSchedule(idBarbero: string): Promise<void> {
  const current = await HorarioDia.count({ where: { idBarbero } });
  if (current === 0) {
    await HorarioDia.bulkCreate(
      DEFAULT_SCHEDULE.map((schedule) => ({ ...schedule, idBarbero })),
    );
  }
}

export async function listSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
  await ensureSchedule(req.auth!.sub);
  const schedules = await HorarioDia.findAll({
    where: { idBarbero: req.auth!.sub },
    order: [["idx", "ASC"]],
  });
  res.json(schedules.map(serializeSchedule));
}

export async function updateSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
  const idx = Number(req.params.idx ?? req.body?.idx);
  if (!Number.isInteger(idx) || idx < 0 || idx > 6) {
    throw new HttpError(400, "idx debe ser un dia entre 0 y 6");
  }
  await ensureSchedule(req.auth!.sub);
  const schedule = await HorarioDia.findOne({ where: { idBarbero: req.auth!.sub, idx } });
  if (!schedule) throw new HttpError(404, "Horario no encontrado");
  const next = {
    inicio: req.body?.inicio === undefined ? schedule.inicio : time(req.body.inicio, "inicio"),
    fin: req.body?.fin === undefined ? schedule.fin : time(req.body.fin, "fin"),
    descansoIni:
      req.body?.descansoIni === undefined
        ? schedule.descansoIni
        : time(req.body.descansoIni, "descansoIni", true),
    descansoFin:
      req.body?.descansoFin === undefined
        ? schedule.descansoFin
        : time(req.body.descansoFin, "descansoFin", true),
  };
  validateTimes(next);
  await schedule.update({
    ...next,
    activo: req.body?.activo === undefined ? schedule.activo : Boolean(req.body.activo),
  });
  res.json(serializeSchedule(schedule));
}

export async function listDaysOff(req: AuthenticatedRequest, res: Response): Promise<void> {
  const days = await DiaLibre.findAll({
    where: { idBarbero: req.auth!.sub },
    order: [["fecha", "ASC"]],
  });
  res.json(days.map(({ id, fecha, motivo }) => ({ id, fecha, motivo })));
}

export async function addDayOff(req: AuthenticatedRequest, res: Response): Promise<void> {
  const fecha = isoDate(req.body?.fecha ?? req.body?.date);
  const [day, created] = await DiaLibre.findOrCreate({
    where: { idBarbero: req.auth!.sub, fecha },
    defaults: {
      idBarbero: req.auth!.sub,
      fecha,
      motivo: optionalString(req.body?.motivo ?? req.body?.reason) || "No disponible",
    },
  });
  if (!created && req.body?.motivo) {
    await day.update({ motivo: optionalString(req.body.motivo) || day.motivo });
  }
  res.status(created ? 201 : 200).json({ id: day.id, fecha: day.fecha, motivo: day.motivo });
}

export async function removeDayOff(req: AuthenticatedRequest, res: Response): Promise<void> {
  const deleted = await DiaLibre.destroy({ where: { id: req.params.id, idBarbero: req.auth!.sub } });
  if (!deleted) throw new HttpError(404, "Dia libre no encontrado");
  res.status(204).send();
}
