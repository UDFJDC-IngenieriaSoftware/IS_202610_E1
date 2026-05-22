import sequelize from "../config/database";
import Cliente from "./Cliente";
import Servicio from "./Servicio";
import Horario from "./Horario";
import Cita from "./Cita";
import Pago from "./Pago";
import Notificacion from "./Notificacion";

// ─── DEFINICIÓN DE RELACIONES Y ASOCIACIONES ─────────────────────────────

// 1. Cliente <-> Cita (Relación 1:N)
Cliente.hasMany(Cita, { foreignKey: "clienteId", as: "citas" });
Cita.belongsTo(Cliente, { foreignKey: "clienteId", as: "cliente" });

// 2. Servicio <-> Cita (Relación 1:N)
Servicio.hasMany(Cita, { foreignKey: "servicioId", as: "citas" });
Cita.belongsTo(Servicio, { foreignKey: "servicioId", as: "servicio" });

// 3. Horario <-> Cita (Relación 1:N)
Horario.hasMany(Cita, { foreignKey: "horarioId", as: "citas" });
Cita.belongsTo(Horario, { foreignKey: "horarioId", as: "horario" });

// 4. Cita <-> Pago (Relación 1:1 o 1:N - mapeado con FK cita_id en tabla Pago)
Cita.hasOne(Pago, { foreignKey: "citaId", as: "pago" });
Pago.belongsTo(Cita, { foreignKey: "citaId", as: "cita" });

// 5. Cita <-> Notificacion (Relación 1:N)
Cita.hasMany(Notificacion, { foreignKey: "citaId", as: "notificaciones" });
Notificacion.belongsTo(Cita, { foreignKey: "citaId", as: "cita" });

export {
  sequelize,
  Cliente,
  Servicio,
  Horario,
  Cita,
  Pago,
  Notificacion,
};
