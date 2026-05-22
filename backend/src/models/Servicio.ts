import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface ServicioAttributes {
  id: string;
  nombre: string;
  precio: number;
  duracion: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServicioCreationAttributes extends Optional<ServicioAttributes, "id"> {}

class Servicio extends Model<ServicioAttributes, ServicioCreationAttributes> implements ServicioAttributes {
  public id!: string;
  public nombre!: string;
  public precio!: number;
  public duracion!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Servicio.init(
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
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const rawValue = this.getDataValue("precio");
        return rawValue ? parseFloat(rawValue as unknown as string) : 0;
      }
    },
    duracion: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Servicio",
    tableName: "servicios",
  }
);

export default Servicio;
