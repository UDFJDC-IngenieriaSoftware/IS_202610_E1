import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface ClienteAttributes {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  celular: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClienteCreationAttributes extends Optional<ClienteAttributes, "id"> {}

class Cliente extends Model<ClienteAttributes, ClienteCreationAttributes> implements ClienteAttributes {
  declare public id: string;
  declare public nombres: string;
  declare public apellidos: string;
  declare public email: string;
  declare public celular: string;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Cliente.init(
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    celular: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Cliente",
    tableName: "clientes",
  }
);

export default Cliente;
