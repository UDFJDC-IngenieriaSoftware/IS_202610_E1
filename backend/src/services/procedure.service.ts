import Servicio, { ServicioAttributes } from "../models/Servicio";

export class ProcedureService {
  constructor(private procedureModel: Servicio) {}

  async getAllProcedures(): Promise<ServicioAttributes[]> {
    const mockServicios = [
      {
        id: "1",
        nombre: "Corte de Cabello Premium",
        precio: 25000,
        duracion: 30,
      },
      {
        id: "2",
        nombre: "Barba y Toalla Caliente",
        precio: 15000,
        duracion: 20,
      },
      {
        id: "3",
        nombre: "Combo Corte + Barba + Bebida",
        precio: 35000,
        duracion: 45,
      },
      { id: "4", nombre: "Corte Infantil", precio: 18000, duracion: 25 },
      {
        id: "5",
        nombre: "Lavado e Hidratación Capilar",
        precio: 12000,
        duracion: 15,
      },
    ];
    return mockServicios;
  }

  async getBarberProcedures(idBarber) {
    return Servicio.findAll({
      where: {
        idBarbero: idBarber,
      },
      raw: true,
    });
  }

  async getServicesMenuText(): Promise<string> {
    const procedures = await Servicio.findAll({
      include: ["barbero"],
    });

    let mensaje = `💈 *Nuestros Servicios - MiTurno* 💈\n`;
    mensaje += `Aquí tienes el menú de servicios disponibles que puedes reservar:\n\n`;

    procedures.forEach((serv) => {
      const servJson = serv.toJSON() as ServicioAttributes;
      const barberName = servJson.barbero
        ? `${servJson.barbero.nombres} ${servJson.barbero.apellidos}`
        : "Barbero";

      const precioFormateado = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(servJson.precio);

      mensaje += `🔹 *${servJson.nombre}* (por ${barberName})\n`;
      if (servJson.descripcion) {
        mensaje += `   📝 _${servJson.descripcion}_\n`;
      }
      mensaje += `   💵 Precio: ${precioFormateado}\n`;
      mensaje += `   ⏱️ Duración: ${servJson.duracion} minutos\n\n`;
    });

    mensaje += `👉 Para agendar, escribe *menú* y elige la opción que prefieras para comunicarte con nosotros.`;

    return mensaje.trim();
  }

  async selectProcedure(
    idProcedure: string,
  ): Promise<ServicioAttributes | null> {
    return await Servicio.findByPk(idProcedure);
  }

  async checkAvailability(idProcedure: string): Promise<boolean> {
    return true;
  }

  async getDescription(idProcedure): Promise<any> {
    const description = await Servicio.findByPk(idProcedure, { raw: true });
    const { nombre, duracion, descripcion, precio } = description;
    const text = `${nombre}
    descripción: ${descripcion}
    precio: ${precio}
    duración: ${duracion}
    `;
    return text;
  }
}
