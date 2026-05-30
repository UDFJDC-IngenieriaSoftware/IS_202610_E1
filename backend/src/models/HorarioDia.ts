import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface HorarioDiaAttributes {
  id: string;
  idBarbero: string;
  idx: number;
  activo: boolean;
  inicio: string;
  fin: string;
  descansoIni: string;
  descansoFin: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HorarioDiaCreationAttributes
  extends Optional<HorarioDiaAttributes, "id" | "activo" | "descansoIni" | "descansoFin"> {}

class HorarioDia
  extends Model<HorarioDiaAttributes, HorarioDiaCreationAttributes>
  implements HorarioDiaAttributes {
  declare public id: string;
  declare public idBarbero: string;
  declare public idx: number;
  declare public activo: boolean;
  declare public inicio: string;
  declare public fin: string;
  declare public descansoIni: string;
  declare public descansoFin: string;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

HorarioDia.init(
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
      field: "id_barbero",
    },
    idx: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    inicio: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    fin: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    descansoIni: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: "",
      field: "descanso_ini",
    },
    descansoFin: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: "",
      field: "descanso_fin",
    },
  },
  {
    sequelize,
    modelName: "HorarioDia",
    tableName: "horarios_configuracion",
    indexes: [{ unique: true, fields: ["id_barbero", "idx"] }],
  },
);

export default HorarioDia;
