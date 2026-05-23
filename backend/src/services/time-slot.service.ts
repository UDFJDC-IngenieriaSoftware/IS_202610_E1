import { timeSlotStatus } from "../controllers/bot.types";
import Horario from "../models/Horario";
export class TimeSlotService {
  constructor() {}

  public async getProcedureTimeslots(idProcedure: string): Promise<any> {
    const timeSlots = await Horario.findAll({
      where: { idServicio: idProcedure, estado: timeSlotStatus.available },
      raw: true,
    });

    console.log("getProcedureTimeslots", timeSlots[0]);

    return timeSlots;
  }
}
