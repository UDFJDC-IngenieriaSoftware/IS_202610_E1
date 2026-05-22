import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface PagoAttributes {
  id: string;
  monto: number;
  estado: string;
  referencia: string | null;
  citaId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PagoCreationAttributes extends Optional<PagoAttributes, "id" | "estado" | "referencia"> {}

class Pago extends Model<PagoAttributes, PagoCreationAttributes> implements PagoAttributes {
  public id!: string;
  public monto!: number;
  public estado!: string;
  public referencia!: string | null;
  public citaId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Pago.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const rawValue = this.getDataValue("monto");
        return rawValue ? parseFloat(rawValue as unknown as string) : 0;
      }
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pendiente",
    },
    referencia: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    citaId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "cita_id",
    },
  },
  {
    sequelize,
    modelName: "Pago",
    tableName: "pagos",
  }
);

export default Pago;
