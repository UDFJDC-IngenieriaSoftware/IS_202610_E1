import { Op } from "sequelize";
import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { Cita, Cliente, Horario, Servicio } from "../models";
import { emailString, HttpError, optionalString, requiredString } from "../utils/http";

async function ownedCustomer(req: AuthenticatedRequest): Promise<Cliente> {
  const id = requiredString(req.params.id, "id");
  const customer = await Cliente.findOne({
    where: { id },
    include: [
      {
        model: Cita,
        as: "citas",
        required: true,
        include: [
          {
            model: Horario,
            as: "horario",
            required: true,
            include: [
              {
                model: Servicio,
                as: "servicio",
                required: true,
                where: { idBarbero: req.auth!.sub },
              },
            ],
          },
        ],
      },
    ],
  });
  if (!customer) throw new HttpError(404, "Cliente no encontrado");
  return customer;
}

function serialize(customer: Cliente) {
  return {
    id: customer.id,
    nombres: customer.nombres,
    apellidos: customer.apellidos,
    email: customer.email,
    celular: customer.celular,
  };
}

function serializeWithStats(customer: Cliente) {
  const citas: any[] = (customer as any).citas ?? [];

  const totalCitas = citas.length;

  const fechas = citas
    .map((c) => c.horario?.fecha as string | undefined)
    .filter(Boolean) as string[];
  const ultimaVisita = fechas.length > 0 ? [...fechas].sort().reverse()[0] : null;

  const counts: Record<string, number> = {};
  for (const cita of citas) {
    const nombre: string | undefined = cita.horario?.servicio?.nombre;
    if (nombre) counts[nombre] = (counts[nombre] ?? 0) + 1;
  }
  const servicioFrecuente =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    ...serialize(customer),
    totalCitas,
    ultimaVisita,
    servicioFrecuente,
  };
}

export async function listCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const busqueda = req.query.busqueda as string | undefined;

  const customers = await Cliente.findAll({
    include: [
      {
        model: Cita,
        as: "citas",
        required: true,
        include: [
          {
            model: Horario,
            as: "horario",
            required: true,
            include: [
              { model: Servicio, as: "servicio", required: true, where: { idBarbero: req.auth!.sub } },
            ],
          },
        ],
      },
    ],
    order: [["nombres", "ASC"]],
  });

  let result = customers.map(serializeWithStats);

  if (busqueda) {
    const q = busqueda.toLowerCase();
    result = result.filter(
      (c) =>
        c.nombres.toLowerCase().includes(q) ||
        c.apellidos.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.celular.includes(q),
    );
  }

  res.json(result);
}

export async function getCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json(serializeWithStats(await ownedCustomer(req)));
}

export async function updateCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const customer = await ownedCustomer(req);
  await customer.update({
    nombres: optionalString(req.body?.nombres) || customer.nombres,
    apellidos: optionalString(req.body?.apellidos) || customer.apellidos,
    email: req.body?.email === undefined ? customer.email : emailString(req.body.email),
    celular: optionalString(req.body?.celular) || customer.celular,
  });
  res.json(serialize(customer));
}

export async function deleteCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const customer = await ownedCustomer(req);

  // Verificar que no tenga citas futuras confirmadas o pendientes
  const hoy = new Date().toISOString().split("T")[0];
  const citasFuturas = await Cita.count({
    where: { idCliente: customer.id, estado: ["confirmada", "pendiente"] },
    include: [
      {
        model: Horario,
        as: "horario",
        required: true,
        where: { fecha: { [Op.gte]: hoy } },
      },
    ],
  });

  if (citasFuturas > 0) {
    throw new HttpError(409, `El cliente tiene ${citasFuturas} cita(s) pendiente(s) o confirmada(s). Cancélalas antes de eliminar.`);
  }

  await customer.destroy();
  res.status(204).send();
}
