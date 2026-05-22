const { Sequelize } = require("sequelize");

// Carga las variables definidas por Docker Compose o el archivo .env correspondiente
const dbName = process.env.POSTGRES_DB || "bot_db";
const dbUser = process.env.POSTGRES_USER || "postgres";
const dbPassword = process.env.POSTGRES_PASSWORD || "postgres_password";
const dbHost = process.env.DB_HOST || "database"; // "database" es el nombre del servicio en docker-compose
const dbPort = process.env.DB_PORT || 5432;

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
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    underscored: true, // Convierte camelCase a snake_case (ej. clienteId -> cliente_id en DB)
  },
});

module.exports = sequelize;
