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

export async function listCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
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
  res.json(customers.map(serialize));
}

export async function getCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json(serialize(await ownedCustomer(req)));
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
