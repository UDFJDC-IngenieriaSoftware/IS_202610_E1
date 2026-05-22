const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Servicio extends Model {}

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
      type: DataTypes.DECIMAL(10, 2), // 10 dígitos en total, 2 decimales
      allowNull: false,
    },
    duracion: {
      type: DataTypes.INTEGER, // Duración en minutos
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Servicio",
    tableName: "servicios",
  }
);

module.exports = Servicio;
