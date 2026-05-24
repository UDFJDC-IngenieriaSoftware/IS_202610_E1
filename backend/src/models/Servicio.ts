import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'

export interface ServicioAttributes {
  id: string
  nombre: string
  duracion: number
  descripcion?: string
  precio: number
  activo: boolean
  idBarbero: string
  createdAt?: Date
  updatedAt?: Date
  barbero?: any
}

export interface ServicioCreationAttributes
  extends Optional<ServicioAttributes, 'id' | 'descripcion' | 'activo'> {}

class Servicio
  extends Model<ServicioAttributes, ServicioCreationAttributes>
  implements ServicioAttributes
{
  declare public id: string
  declare public nombre: string
  declare public duracion: number
  declare public descripcion: string
  declare public precio: number
  declare public activo: boolean
  declare public idBarbero: string

  declare public readonly createdAt: Date
  declare public readonly updatedAt: Date
}

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
    duracion: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('precio')
        return rawValue ? parseFloat(rawValue as unknown as string) : 0
      },
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    idBarbero: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'id_barbero',
    },
  },
  {
    sequelize,
    modelName: 'Servicio',
    tableName: 'servicios',
  },
)

export default Servicio
