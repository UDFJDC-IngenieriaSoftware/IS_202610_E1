import sequelize from "../config/database";
import Cliente from "./Cliente";
import Barbero from "./Barbero";
import Servicio from "./Servicio";
import Horario from "./Horario";
import Cita from "./Cita";
import Pago from "./Pago";
import Notificacion from "./Notificacion";

// ─── DEFINICIÓN DE RELACIONES Y ASOCIACIONES ─────────────────────────────

// 1. Barbero <-> Servicio (Relación 1:N)
Barbero.hasMany(Servicio, { foreignKey: "idBarbero", as: "servicios" });
Servicio.belongsTo(Barbero, { foreignKey: "idBarbero", as: "barbero" });

// 2. Servicio <-> Horario (Relación 1:N)
Servicio.hasMany(Horario, { foreignKey: "idServicio", as: "horarios" });
Horario.belongsTo(Servicio, { foreignKey: "idServicio", as: "servicio" });

// 3. Horario <-> Cita (Relación 1:1 - Un horario solo puede pertenecer a una cita)
Horario.hasOne(Cita, { foreignKey: "idHorario", as: "cita" });
Cita.belongsTo(Horario, { foreignKey: "idHorario", as: "horario" });

// 4. Cliente <-> Cita (Relación 1:N)
Cliente.hasMany(Cita, { foreignKey: "idCliente", as: "citas" });
Cita.belongsTo(Cliente, { foreignKey: "idCliente", as: "cliente" });

// 5. Cita <-> Pago (Relación 1:N)
Cita.hasMany(Pago, { foreignKey: "idCita", as: "pagos" });
Pago.belongsTo(Cita, { foreignKey: "idCita", as: "cita" });

// 6. Cita <-> Notificacion (Relación 1:N)
Cita.hasMany(Notificacion, { foreignKey: "idCita", as: "notificaciones" });
Notificacion.belongsTo(Cita, { foreignKey: "idCita", as: "cita" });

export {
  sequelize,
  Cliente,
  Barbero,
  Servicio,
  Horario,
  Cita,
  Pago,
  Notificacion,
};
