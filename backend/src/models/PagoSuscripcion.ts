import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'
import type { PlanId } from './Plan'

export type EstadoPagoSus = 'exitoso' | 'fallido' | 'pendiente'
export type MetodoPago = 'PSE' | 'Tarjeta'

export interface PagoSuscripcionAttributes {
  id: string
  idBarbero: string
  plan: PlanId
  monto: number
  fecha: string     // DATEONLY → string yyyy-mm-dd
  estado: EstadoPagoSus
  metodo: MetodoPago
  referencia: string
  createdAt?: Date
  updatedAt?: Date
}

export interface PagoSuscripcionCreationAttributes
  extends Optional<PagoSuscripcionAttributes, 'id'> {}

class PagoSuscripcion
  extends Model<PagoSuscripcionAttributes, PagoSuscripcionCreationAttributes>
  implements PagoSuscripcionAttributes
{
  declare public id: string
  declare public idBarbero: string
  declare public plan: PlanId
  declare public monto: number
  declare public fecha: string
  declare public estado: EstadoPagoSus
  declare public metodo: MetodoPago
  declare public referencia: string

  declare public readonly createdAt: Date
  declare public readonly updatedAt: Date
}

PagoSuscripcion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    idBarbero: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'id_barbero',
    },
    plan: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    monto: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('exitoso', 'fallido', 'pendiente'),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    metodo: {
      type: DataTypes.ENUM('PSE', 'Tarjeta'),
      allowNull: false,
    },
    referencia: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'PagoSuscripcion',
    tableName: 'pagos_suscripcion',
  },
)

export default PagoSuscripcion
