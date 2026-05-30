import { Sequelize } from "sequelize";
import "./env";

const dbName = process.env.POSTGRES_DB || "bot_db";
const dbUser = process.env.POSTGRES_USER || "postgres";
const dbPassword = process.env.POSTGRES_PASSWORD || "postgres_password";
const dbHost = process.env.DB_HOST || "database";
const dbPort = parseInt(process.env.DB_PORT || "5432", 10);

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: "postgres",
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
});

export default sequelize;
