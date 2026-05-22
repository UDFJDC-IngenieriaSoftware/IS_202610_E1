const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Notificacion extends Model {}

Notificacion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    mensaje: {
      type: DataTypes.TEXT, // Usamos TEXT para dar soporte a mensajes largos e interactivos
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false, // Por ejemplo: whatsapp, email, push
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

module.exports = Notificacion;
