import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface CitaAttributes {
  id: string;
  estado: string;
  precio: number;
  idHorario: string;
  idCliente: string;
  reminder24hSent: boolean;
  reminder2hSent: boolean;
  reminder24hRetries: number;
  reminder2hRetries: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CitaCreationAttributes extends Optional<
  CitaAttributes,
  "id" | "estado" | "reminder24hSent" | "reminder2hSent" | "reminder24hRetries" | "reminder2hRetries"
> {}

class Cita
  extends Model<CitaAttributes, CitaCreationAttributes>
  implements CitaAttributes
{
  declare public id: string;
  declare public estado: string;
  declare public precio: number;
  declare public idHorario: string;
  declare public idCliente: string;
  declare public reminder24hSent: boolean;
  declare public reminder2hSent: boolean;
  declare public reminder24hRetries: number;
  declare public reminder2hRetries: number;

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
      },
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
    reminder24hSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "reminder_24h_sent",
    },
    reminder2hSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "reminder_2h_sent",
    },
    reminder24hRetries: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "reminder_24h_retries",
    },
    reminder2hRetries: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "reminder_2h_retries",
    },
  },
  {
    sequelize,
    modelName: "Cita",
    tableName: "citas",
  },
);

export default Cita;
