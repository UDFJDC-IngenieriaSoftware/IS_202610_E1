import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface CitaAttributes {
  id: string;
  estado: string;
  precio: number;
  idHorario: string;
  idCliente: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CitaCreationAttributes extends Optional<CitaAttributes, "id" | "estado"> {}

class Cita extends Model<CitaAttributes, CitaCreationAttributes> implements CitaAttributes {
  declare public id: string;
  declare public estado: string;
  declare public precio: number;
  declare public idHorario: string;
  declare public idCliente: string;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Cita.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pendiente",
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const rawValue = this.getDataValue("precio");
        return rawValue ? parseFloat(rawValue as unknown as string) : 0;
      }
    },
    idHorario: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "id_horario",
    },
    idCliente: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "id_cliente",
    },
  },
  {
    sequelize,
    modelName: "Cita",
    tableName: "citas",
  }
);

export default Cita;
