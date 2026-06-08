import { Sequelize } from "sequelize";
import "./env";

const dbName = process.env.POSTGRES_DB || "bot_db";
const dbUser = process.env.POSTGRES_USER || "postgres";
const dbPassword = process.env.POSTGRES_PASSWORD || "postgres_password";
const dbHost = process.env.DB_HOST || "database";
const dbPort = parseInt(process.env.DB_PORT || "5432", 10);

// Colombia (America/Bogota) no tiene horario de verano: offset fijo -05:00.
const APP_TIMEZONE = "America/Bogota";

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: "postgres",
  // Serializacion de fechas JS<->DB en hora local de Bogota.
  timezone: "-05:00",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
  hooks: {
    // Fija la zona horaria de sesion en cada conexion del pool, para que
    // NOW() y los casts ::timestamptz (p.ej. en el job de recordatorios)
    // operen en hora Bogota y no en UTC.
    afterConnect: async (connection: any) => {
      await connection.query(`SET TIME ZONE '${APP_TIMEZONE}';`);
    },
  },
});

export default sequelize;
