/**
 * HorarioSemanal — configuración semanal de trabajo del barbero.
 * idx: 0=domingo … 6=sábado (igual que JS Date.getDay())
 */
import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'

export interface HorarioSemanalAttributes {
  id: string
  idBarbero: string
  idx: number        // 0-6
  activo: boolean
  inicio: string     // HH:mm
  fin: string        // HH:mm
  descansoIni: string // HH:mm | ''
  descansoFin: string // HH:mm | ''
  createdAt?: Date
  updatedAt?: Date
}

export interface HorarioSemanalCreationAttributes
  extends Optional<HorarioSemanalAttributes, 'id' | 'descansoIni' | 'descansoFin'> {}

class HorarioSemanal
  extends Model<HorarioSemanalAttributes, HorarioSemanalCreationAttributes>
  implements HorarioSemanalAttributes
{
  declare public id: string
  declare public idBarbero: string
  declare public idx: number
  declare public activo: boolean
  declare public inicio: string
  declare public fin: string
  declare public descansoIni: string
  declare public descansoFin: string

  declare public readonly createdAt: Date
  declare public readonly updatedAt: Date
}

HorarioSemanal.init(
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
    idx: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 6 },
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    inicio: {
      type: DataTypes.STRING(5), // HH:mm
      allowNull: false,
      defaultValue: '09:00',
    },
    fin: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: '18:00',
    },
    descansoIni: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: '',
      field: 'descanso_ini',
    },
    descansoFin: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: '',
      field: 'descanso_fin',
    },
  },
  {
    sequelize,
    modelName: 'HorarioSemanal',
    tableName: 'horarios_semanales',
  },
)

export default HorarioSemanal
