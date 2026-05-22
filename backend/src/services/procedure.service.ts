import { ServicioAttributes } from "../models/Servicio";

class Procedure {
  constructor() {}

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

  async selectProcedure(idProcedure: string): Promise<ServicioAttributes> {
    return {
      id: "1",
      nombre: "Lavado e Hidratación Capilar",
      precio: 12000,
      duracion: 15,
    };
  }

  async checkAvailability(idProcedure: string): Promise<boolean> {
    return true;
  }
}

export default new Procedure();
