import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface ClienteAttributes {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClienteCreationAttributes extends Optional<ClienteAttributes, "id"> {}

class Cliente extends Model<ClienteAttributes, ClienteCreationAttributes> implements ClienteAttributes {
  public id!: string;
  public nombre!: string;
  public telefono!: string;
  public email!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Cliente.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    telefono: {
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
  },
  {
    sequelize,
    modelName: "Cliente",
    tableName: "clientes",
  }
);

export default Cliente;
