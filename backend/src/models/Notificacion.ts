import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface NotificacionAttributes {
  id: string;
  mensaje: string;
  tipo: string;
  citaId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificacionCreationAttributes extends Optional<NotificacionAttributes, "id"> {}

class Notificacion extends Model<NotificacionAttributes, NotificacionCreationAttributes> implements NotificacionAttributes {
  public id!: string;
  public mensaje!: string;
  public tipo!: string;
  public citaId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notificacion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    citaId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "cita_id",
    },
  },
  {
    sequelize,
    modelName: "Notificacion",
    tableName: "notificaciones",
  }
);

export default Notificacion;
