import * as dotenv from "dotenv";
const env = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${env}` });
dotenv.config();

import { Client } from "pg";

async function main() {
  const dbName = process.env.POSTGRES_DB || "bot_db";
  const dbUser = process.env.POSTGRES_USER || "postgres";
  const dbPassword = process.env.POSTGRES_PASSWORD || "postgres_password";
  const dbHost = process.env.DB_HOST || "localhost";
  const dbPort = parseInt(process.env.DB_PORT || "5432", 10);

  console.log(`🔌 Conectando a la base de datos ${dbName} en ${dbHost}:${dbPort}...`);

  const client = new Client({
    user: dbUser,
    host: dbHost,
    database: dbName,
    password: dbPassword,
    port: dbPort,
  });

  try {
    await client.connect();
    console.log("✅ Conexión establecida. Limpiando el esquema 'public'...");

    // Droppea el esquema public con todas sus tablas en cascada y lo recrea
    await client.query("DROP SCHEMA public CASCADE;");
    await client.query("CREATE SCHEMA public;");
    await client.query("GRANT ALL ON SCHEMA public TO postgres;");
    await client.query("GRANT ALL ON SCHEMA public TO public;");

    console.log("💥 ¡Base de datos limpiada con éxito! Todo el esquema está vacío.");
  } catch (error) {
    console.error("❌ Error al limpiar la base de datos:", error);
  } finally {
    await client.end();
  }
}

main();
