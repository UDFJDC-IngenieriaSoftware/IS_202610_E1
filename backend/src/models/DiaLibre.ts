import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'

export interface DiaLibreAttributes {
  id: string
  idBarbero: string
  fecha: string   // DATEONLY → yyyy-mm-dd
  motivo: string
  createdAt?: Date
  updatedAt?: Date
}

export interface DiaLibreCreationAttributes
  extends Optional<DiaLibreAttributes, 'id' | 'motivo'> {}

class DiaLibre
  extends Model<DiaLibreAttributes, DiaLibreCreationAttributes>
  implements DiaLibreAttributes
{
  declare public id: string
  declare public idBarbero: string
  declare public fecha: string
  declare public motivo: string

  declare public readonly createdAt: Date
  declare public readonly updatedAt: Date
}

DiaLibre.init(
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
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    motivo: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
  },
  {
    sequelize,
    modelName: 'DiaLibre',
    tableName: 'dias_libres',
  },
)

export default DiaLibre
