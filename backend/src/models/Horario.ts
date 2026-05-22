import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface HorarioAttributes {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HorarioCreationAttributes extends Optional<HorarioAttributes, "id" | "disponible"> {}

class Horario extends Model<HorarioAttributes, HorarioCreationAttributes> implements HorarioAttributes {
  public id!: string;
  public fecha!: string;
  public horaInicio!: string;
  public horaFin!: string;
  public disponible!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
    disponible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Horario",
    tableName: "horarios",
  }
);

export default Horario;
