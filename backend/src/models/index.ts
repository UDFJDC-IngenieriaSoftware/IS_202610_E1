import sequelize from '../config/database'
import Cliente from './Cliente'
import Barbero from './Barbero'
import Servicio from './Servicio'
import Horario from './Horario'
import Cita from './Cita'
import Pago from './Pago'
import Notificacion from './Notificacion'
// ── Nuevos modelos SaaS & auth ──────────────────────────────────────────────
import Usuario from './Usuario'
import Plan from './Plan'
import PagoSuscripcion from './PagoSuscripcion'
import HorarioSemanal from './HorarioSemanal'
import DiaLibre from './DiaLibre'

// ─── DEFINICIÓN DE RELACIONES Y ASOCIACIONES ─────────────────────────────

// 1. Barbero <-> Servicio (1:N)
Barbero.hasMany(Servicio, { foreignKey: 'idBarbero', as: 'servicios' })
Servicio.belongsTo(Barbero, { foreignKey: 'idBarbero', as: 'barbero' })

// 2. Servicio <-> Horario (1:N) — slots de tiempo del bot
Servicio.hasMany(Horario, { foreignKey: 'idServicio', as: 'horarios' })
Horario.belongsTo(Servicio, { foreignKey: 'idServicio', as: 'servicio' })

// 3. Horario <-> Cita (1:1)
Horario.hasOne(Cita, { foreignKey: 'idHorario', as: 'cita' })
Cita.belongsTo(Horario, { foreignKey: 'idHorario', as: 'horario' })

// 4. Cliente <-> Cita (1:N)
Cliente.hasMany(Cita, { foreignKey: 'idCliente', as: 'citas' })
Cita.belongsTo(Cliente, { foreignKey: 'idCliente', as: 'cliente' })

// 5. Cita <-> Pago (pago de cita, 1:N)
Cita.hasMany(Pago, { foreignKey: 'idCita', as: 'pagos' })
Pago.belongsTo(Cita, { foreignKey: 'idCita', as: 'cita' })

// 6. Cita <-> Notificacion (1:N)
Cita.hasMany(Notificacion, { foreignKey: 'idCita', as: 'notificaciones' })
Notificacion.belongsTo(Cita, { foreignKey: 'idCita', as: 'cita' })

// 7. Usuario <-> Barbero (1:1 opcional)
Usuario.belongsTo(Barbero, { foreignKey: 'idBarbero', as: 'barbero' })
Barbero.hasOne(Usuario, { foreignKey: 'idBarbero', as: 'usuario' })

// 8. Barbero <-> PagoSuscripcion (1:N)
Barbero.hasMany(PagoSuscripcion, { foreignKey: 'idBarbero', as: 'pagosSuscripcion' })
PagoSuscripcion.belongsTo(Barbero, { foreignKey: 'idBarbero', as: 'barbero' })

// 9. Barbero <-> HorarioSemanal (1:7)
Barbero.hasMany(HorarioSemanal, { foreignKey: 'idBarbero', as: 'horarioSemanal' })
HorarioSemanal.belongsTo(Barbero, { foreignKey: 'idBarbero', as: 'barbero' })

// 10. Barbero <-> DiaLibre (1:N)
Barbero.hasMany(DiaLibre, { foreignKey: 'idBarbero', as: 'diasLibres' })
DiaLibre.belongsTo(Barbero, { foreignKey: 'idBarbero', as: 'barbero' })

export {
  sequelize,
  Cliente,
  Barbero,
  Servicio,
  Horario,
  Cita,
  Pago,
  Notificacion,
  Usuario,
  Plan,
  PagoSuscripcion,
  HorarioSemanal,
  DiaLibre,
}
