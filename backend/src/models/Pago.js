const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Pago extends Model {}

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
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pendiente", // Por ejemplo: pendiente, pagado, rechazado
    },
    referencia: {
      type: DataTypes.STRING,
      allowNull: true, // Nulo hasta que se reciba el identificador de pago externo
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

module.exports = Pago;
