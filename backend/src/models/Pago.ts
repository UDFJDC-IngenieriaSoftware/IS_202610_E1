import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface PagoAttributes {
  id: string;
  monto: number;
  estado: string;
  referencia: string | null;
  paymentLinkId?: string | null;
  transactionId?: string | null;
  idCita: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PagoCreationAttributes extends Optional<PagoAttributes, "id" | "estado" | "referencia" | "paymentLinkId" | "transactionId"> {}

class Pago extends Model<PagoAttributes, PagoCreationAttributes> implements PagoAttributes {
  declare public id: string;
  declare public monto: number;
  declare public estado: string;
  declare public referencia: string | null;
  declare public paymentLinkId: string | null;
  declare public transactionId: string | null;
  declare public idCita: string;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
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
    paymentLinkId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "payment_link_id",
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "transaction_id",
    },
    idCita: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "id_cita",
    },
  },
  {
    sequelize,
    modelName: "Pago",
    tableName: "pagos",
  }
);

export default Pago;
