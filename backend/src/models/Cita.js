const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Cita extends Model {}

Cita.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hora: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pendiente", // Por ejemplo: pendiente, confirmada, cancelada
    },
    // Declaración explícita de claves foráneas para control tipado rápido:
    clienteId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "cliente_id",
    },
    servicioId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "servicio_id",
    },
    horarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "horario_id",
    },
  },
  {
    sequelize,
    modelName: "Cita",
    tableName: "citas",
  }
);

module.exports = Cita;
