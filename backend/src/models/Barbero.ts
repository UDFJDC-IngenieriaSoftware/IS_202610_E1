import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'
import type { PlanId } from './Plan'

export type EstadoSuscripcion = 'activa' | 'trial' | 'morosa' | 'cancelada'

export interface BarberoAttributes {
  id: string
  nombres: string
  apellidos: string
  celular: string
  activo: boolean
  direccion?: string
  email?: string
  // ── Campos SaaS ──────────────────────────────────────────────
  barberia?: string
  ciudad?: string
  plan?: PlanId
  estadoSuscripcion?: EstadoSuscripcion
  alta?: string          // DATEONLY yyyy-mm-dd
  proxCobro?: string     // DATEONLY yyyy-mm-dd | null
  citasMaximo?: number | null
  citasMes?: number      // calculado o actualizado periódicamente
  createdAt?: Date
  updatedAt?: Date
}

export interface BarberoCreationAttributes
  extends Optional<
    BarberoAttributes,
    | 'id'
    | 'activo'
    | 'direccion'
    | 'email'
    | 'barberia'
    | 'ciudad'
    | 'plan'
    | 'estadoSuscripcion'
    | 'alta'
    | 'proxCobro'
    | 'citasMaximo'
    | 'citasMes'
  > {}

class Barbero
  extends Model<BarberoAttributes, BarberoCreationAttributes>
  implements BarberoAttributes
{
  declare public id: string
  declare public nombres: string
  declare public apellidos: string
  declare public celular: string
  declare public activo: boolean
  declare public direccion: string
  declare public email: string
  declare public barberia: string
  declare public ciudad: string
  declare public plan: PlanId
  declare public estadoSuscripcion: EstadoSuscripcion
  declare public alta: string
  declare public proxCobro: string
  declare public citasMaximo: number | null
  declare public citasMes: number

  declare public readonly createdAt: Date
  declare public readonly updatedAt: Date
}

Barbero.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    nombres: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    apellidos: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    celular: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    direccion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true },
    },
    // ── Campos SaaS ──────────────────────────────────────────────
    barberia: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ciudad: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    plan: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'solo',
    },
    estadoSuscripcion: {
      type: DataTypes.ENUM('activa', 'trial', 'morosa', 'cancelada'),
      allowNull: true,
      defaultValue: 'trial',
      field: 'estado_suscripcion',
    },
    alta: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    proxCobro: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'prox_cobro',
    },
    citasMaximo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'citas_maximo',
    },
    citasMes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'citas_mes',
    },
  },
  {
    sequelize,
    modelName: 'Barbero',
    tableName: 'barberos',
  },
)

export default Barbero
