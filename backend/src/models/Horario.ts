import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface HorarioAttributes {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  idServicio: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HorarioCreationAttributes extends Optional<HorarioAttributes, "id" | "estado"> {}

class Horario extends Model<HorarioAttributes, HorarioCreationAttributes> implements HorarioAttributes {
  declare public id: string;
  declare public fecha: string;
  declare public horaInicio: string;
  declare public horaFin: string;
  declare public estado: string;
  declare public idServicio: string;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Horario.init(
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
    horaInicio: {
      type: DataTypes.TIME,
      allowNull: false,
      field: "hora_inicio",
    },
    horaFin: {
      type: DataTypes.TIME,
      allowNull: false,
      field: "hora_fin",
    },
    estado: {
      type: DataTypes.STRING,
      defaultValue: "disponible",
      allowNull: false,
    },
    idServicio: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "id_servicio",
    },
  },
  {
    sequelize,
    modelName: "Horario",
    tableName: "horarios",
  }
);

export default Horario;
