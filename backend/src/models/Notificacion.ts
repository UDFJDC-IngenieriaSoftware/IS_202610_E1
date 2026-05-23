import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface NotificacionAttributes {
  id: string;
  mensaje: string;
  tipo: string;
  idCita: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificacionCreationAttributes extends Optional<NotificacionAttributes, "id"> {}

class Notificacion extends Model<NotificacionAttributes, NotificacionCreationAttributes> implements NotificacionAttributes {
  declare public id: string;
  declare public mensaje: string;
  declare public tipo: string;
  declare public idCita: string;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
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
    idCita: {
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
