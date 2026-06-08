import { Op } from "sequelize";
import { timeSlotStatus } from "../controllers/bot.types";
import Horario from "../models/Horario";
export class TimeSlotService {
  constructor() {}

  public async getProcedureTimeslotsByDate(
    idProcedure: string,
    date: string,
  ): Promise<any> {
    const timeSlots = await Horario.findAll({
      where: {
        idServicio: idProcedure,
        estado: timeSlotStatus.available,
        fecha: date,
      },
      raw: true,
    });

    return timeSlots;
  }

  public async getDates(idProcedure: string): Promise<any> {
    const today = new Date().toISOString().split("T")[0];
    const timeSlots = await Horario.findAll({
      attributes: ["fecha"],
      where: {
        idServicio: idProcedure,
        estado: timeSlotStatus.available,
        fecha: { [Op.gt]: today },
      },
      group: ["fecha"],
      order: [["fecha", "ASC"]],
      raw: true,
    });
    // .map((h) => h.fecha);

    return timeSlots;
  }
}
