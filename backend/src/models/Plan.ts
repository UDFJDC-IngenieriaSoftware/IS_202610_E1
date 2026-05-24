import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'

export type PlanId = 'solo' | 'pro' | 'estudio'

export interface PlanAttributes {
  id: PlanId
  nombre: string
  precio: number
  citasMaximo: number | null
  features: string[]
  createdAt?: Date
  updatedAt?: Date
}

export interface PlanCreationAttributes
  extends Optional<PlanAttributes, 'createdAt' | 'updatedAt'> {}

class Plan
  extends Model<PlanAttributes, PlanCreationAttributes>
  implements PlanAttributes
{
  declare public id: PlanId
  declare public nombre: string
  declare public precio: number
  declare public citasMaximo: number | null
  declare public features: string[]

  declare public readonly createdAt: Date
  declare public readonly updatedAt: Date
}

Plan.init(
  {
    id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    precio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'COP / mes',
    },
    citasMaximo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'citas_maximo',
      comment: 'null = ilimitado',
    },
    features: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Plan',
    tableName: 'planes',
  },
)

export default Plan
