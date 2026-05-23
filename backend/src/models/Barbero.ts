import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface BarberoAttributes {
  id: string;
  nombres: string;
  apellidos: string;
  celular: string;
  activo: boolean;
  direccion?: string;
  email?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BarberoCreationAttributes extends Optional<BarberoAttributes, "id" | "activo" | "direccion" | "email"> {}

class Barbero extends Model<BarberoAttributes, BarberoCreationAttributes> implements BarberoAttributes {
  declare public id: string;
  declare public nombres: string;
  declare public apellidos: string;
  declare public celular: string;
  declare public activo: boolean;
  declare public direccion: string;
  declare public email: string;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Barbero.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    nombres: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    apellidos: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    celular: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    direccion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
  },
  {
    sequelize,
    modelName: "Barbero",
    tableName: "barberos",
  }
);

export default Barbero;
