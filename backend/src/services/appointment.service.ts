import { Cita } from "../models";

export class AppointmentService {
  constructor() {}

  public async create(appointmentData: any): Promise<any> {
    const appointment = await Cita.create(appointmentData);

    return appointment;
  }
}
