import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { Servicio } from "../models";
import { HttpError, optionalString, requiredNumber, requiredString } from "../utils/http";

function serialize(service: Servicio) {
  return {
    id: service.id,
    nombre: service.nombre,
    duracion: service.duracion,
    precio: service.precio,
    activo: service.activo,
    descripcion: service.descripcion || "",
  };
}

async function ownedService(req: AuthenticatedRequest): Promise<Servicio> {
  const service = await Servicio.findOne({
    where: { id: req.params.id, idBarbero: req.auth?.sub },
  });
  if (!service) throw new HttpError(404, "Servicio no encontrado");
  return service;
}

export async function listServices(req: AuthenticatedRequest, res: Response): Promise<void> {
  const where: { idBarbero?: string; activo?: boolean } = { idBarbero: req.auth?.sub };
  if (req.query.activo === "true") where.activo = true;
  const services = await Servicio.findAll({ where, order: [["nombre", "ASC"]] });
  res.json(services.map(serialize));
}

export async function getService(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json(serialize(await ownedService(req)));
}

export async function createService(req: AuthenticatedRequest, res: Response): Promise<void> {
  const service = await Servicio.create({
    nombre: requiredString(req.body?.nombre ?? req.body?.name, "nombre", 2),
    duracion: requiredNumber(req.body?.duracion ?? req.body?.duration, "duracion", 1),
    precio: requiredNumber(req.body?.precio ?? req.body?.price, "precio", 1),
    descripcion: optionalString(req.body?.descripcion ?? req.body?.description) || "",
    activo: req.body?.activo !== false,
    idBarbero: req.auth!.sub,
  });
  res.status(201).json(serialize(service));
}

export async function updateService(req: AuthenticatedRequest, res: Response): Promise<void> {
  const service = await ownedService(req);
  const data: Partial<{
    nombre: string;
    duracion: number;
    precio: number;
    descripcion: string;
    activo: boolean;
  }> = {};
  if (req.body?.nombre !== undefined || req.body?.name !== undefined) {
    data.nombre = requiredString(req.body.nombre ?? req.body.name, "nombre", 2);
  }
  if (req.body?.duracion !== undefined || req.body?.duration !== undefined) {
    data.duracion = requiredNumber(req.body.duracion ?? req.body.duration, "duracion", 1);
  }
  if (req.body?.precio !== undefined || req.body?.price !== undefined) {
    data.precio = requiredNumber(req.body.precio ?? req.body.price, "precio", 1);
  }
  if (req.body?.descripcion !== undefined || req.body?.description !== undefined) {
    data.descripcion = optionalString(req.body.descripcion ?? req.body.description) || "";
  }
  if (req.body?.activo !== undefined) data.activo = Boolean(req.body.activo);
  await service.update(data);
  res.json(serialize(service));
}

export async function deleteService(req: AuthenticatedRequest, res: Response): Promise<void> {
  const service = await ownedService(req);
  await service.update({ activo: false });
  res.status(204).send();
}

export async function toggleService(req: AuthenticatedRequest, res: Response): Promise<void> {
  const service = await ownedService(req);
  await service.update({ activo: !service.activo });
  res.json(serialize(service));
}
