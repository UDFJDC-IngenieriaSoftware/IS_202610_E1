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
  passwordHash?: string | null;
  barberia?: string | null;
  ciudad?: string | null;
  rol: "barbero" | "admin";
  plan: "solo" | "pro" | "estudio";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BarberoCreationAttributes extends Optional<BarberoAttributes, "id" | "activo" | "direccion" | "email" | "passwordHash" | "barberia" | "ciudad" | "rol" | "plan"> {}

class Barbero extends Model<BarberoAttributes, BarberoCreationAttributes> implements BarberoAttributes {
  declare public id: string;
  declare public nombres: string;
  declare public apellidos: string;
  declare public celular: string;
  declare public activo: boolean;
  declare public direccion: string;
  declare public email: string;
  declare public passwordHash: string | null;
  declare public barberia: string | null;
  declare public ciudad: string | null;
  declare public rol: "barbero" | "admin";
  declare public plan: "solo" | "pro" | "estudio";

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
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "password_hash",
    },
    barberia: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ciudad: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rol: {
      type: DataTypes.STRING,
      defaultValue: "barbero",
      allowNull: false,
    },
    plan: {
      type: DataTypes.STRING,
      defaultValue: "solo",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Barbero",
    tableName: "barberos",
  }
);

export default Barbero;
