const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Horario extends Model {}

Horario.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY, // Solo fecha (YYYY-MM-DD)
      allowNull: false,
    },
    horaInicio: {
      type: DataTypes.TIME, // Solo hora (HH:MM:SS)
      allowNull: false,
      field: "hora_inicio",
    },
    horaFin: {
      type: DataTypes.TIME,
      allowNull: false,
      field: "hora_fin",
    },
    disponible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Horario",
    tableName: "horarios",
  }
);

module.exports = Horario;
