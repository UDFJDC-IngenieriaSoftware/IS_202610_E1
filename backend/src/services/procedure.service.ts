import Servicio from "../models/Servicio";

export class ProcedureService {
  constructor(private procedureModel: Servicio) {}

  async getAllProcedures(): Promise<any[]> {
    const mockServicios = [
      {
        id: "1",
        nombre: "Corte de Cabello Premium",
        precio: 25000,
        duracion: 30,
        idBarbero: "b0e86958-8686-4e38-967a-0e7845ef2001",
      },
      {
        id: "2",
        nombre: "Barba y Toalla Caliente",
        precio: 15000,
        duracion: 20,
        idBarbero: "b0e86958-8686-4e38-967a-0e7845ef2001",
      },
      {
        id: "3",
        nombre: "Combo Corte + Barba + Bebida",
        precio: 35000,
        duracion: 45,
        idBarbero: "b0e86958-8686-4e38-967a-0e7845ef2001",
      },
      {
        id: "4",
        nombre: "Corte Infantil",
        precio: 18000,
        duracion: 25,
        idBarbero: "b0e86958-8686-4e38-967a-0e7845ef2002",
      },
      {
        id: "5",
        nombre: "Lavado e Hidratación Capilar",
        precio: 12000,
        duracion: 15,
        idBarbero: "b0e86958-8686-4e38-967a-0e7845ef2002",
      },
    ];
    return mockServicios;
  }

  async getBarberProcedures(idBarber: string): Promise<any[]> {
    return Servicio.findAll({
      where: {
        idBarbero: idBarber,
      },
      raw: true,
    });
  }

  async getServicesMenuText(): Promise<any> {
    const procedures = await Servicio.findAll({
      include: [{ association: "barbero", where: { activo: true } }],
      raw: true,
      nest: true,
    });

    console.log("getServicesMenuText", JSON.stringify(procedures[0]));

    return procedures;
  }

  async selectProcedure(idProcedure: string): Promise<any | null> {
    return await Servicio.findByPk(idProcedure);
  }

  async checkAvailability(idProcedure: string): Promise<boolean> {
    return true;
  }

  async getDescription(idProcedure: string): Promise<any> {
    const service = await Servicio.findByPk(idProcedure);
    if (!service) {
      return "Servicio no encontrado.";
    }
    const servJson = service.toJSON() as any;
    const precioFormateado = new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(servJson.precio);

    return `${servJson.nombre}
descripción: ${servJson.descripcion || "Sin descripción"}
precio: ${precioFormateado}
duración: ${servJson.duracion} minutos\n`;
  }
}
