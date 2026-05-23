import BarberModel from "../models/Barbero";
import { ProcedureService } from "./procedure.service";

export class BarberService {
  constructor(private procedureService: ProcedureService) {}

  async getAllBarbers(): Promise<any> {
    const barbers = await BarberModel.findAll({ raw: true });
    return this.toText(
      barbers
        .map((b, index) => ({ id: index, nombre: b.nombres }))
        .map((b) => `${b.id} - ${b.nombre}`),
    );
  }

  async toText(arrayParam): Promise<any> {
    return arrayParam.join("\n");
  }

  async getProcedures(idBarber): Promise<any> {
    const procedures =
      await this.procedureService.getBarberProcedures(idBarber);

    if (!procedures.length) {
      throw new Error("Barber has not any procedure to offer");
    }

    return this.toText(
      procedures
        .map((p) => ({ name: p.nombre, price: p.precio }))
        .map(
          (p) => `${p.name} - ${p.price}  
        `,
        ),
    );
  }
}
