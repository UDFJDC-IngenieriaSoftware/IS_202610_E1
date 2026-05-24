import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'

export type RolUsuario = 'admin' | 'barbero'

export interface UsuarioAttributes {
  id: string
  email: string
  rol: RolUsuario
  idBarbero?: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface UsuarioCreationAttributes
  extends Optional<UsuarioAttributes, 'id' | 'idBarbero'> {}

class Usuario
  extends Model<UsuarioAttributes, UsuarioCreationAttributes>
  implements UsuarioAttributes
{
  declare public id: string
  declare public email: string
  declare public rol: RolUsuario
  declare public idBarbero: string | null

  declare public readonly createdAt: Date
  declare public readonly updatedAt: Date
}

Usuario.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    rol: {
      type: DataTypes.ENUM('admin', 'barbero'),
      allowNull: false,
      defaultValue: 'barbero',
    },
    idBarbero: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'id_barbero',
    },
  },
  {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
  },
)

export default Usuario
