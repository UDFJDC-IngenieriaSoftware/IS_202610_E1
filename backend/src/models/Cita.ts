import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface CitaAttributes {
  id: string;
  fecha: string;
  hora: string;
  estado: string;
  clienteId: string;
  servicioId: string;
  horarioId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CitaCreationAttributes extends Optional<CitaAttributes, "id" | "estado"> {}

class Cita extends Model<CitaAttributes, CitaCreationAttributes> implements CitaAttributes {
  public id!: string;
  public fecha!: string;
  public hora!: string;
  public estado!: string;
  public clienteId!: string;
  public servicioId!: string;
  public horarioId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Cita.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hora: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pendiente",
    },
    clienteId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "cliente_id",
    },
    servicioId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "servicio_id",
    },
    horarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "horario_id",
    },
  },
  {
    sequelize,
    modelName: "Cita",
    tableName: "citas",
  }
);

export default Cita;
