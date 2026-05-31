import { env } from "./src/config/env";
import { sequelize } from "./src/models";
import app from "./src/app";
import { handleMessage, WebhookEntry } from "./src/controllers/bot.controller";
import whatsappService from "./src/whatsapp.factory";
import { connectRedis } from "./src/config/redis";

export { app };

async function startWhatsappLocal(): Promise<void> {
  if (env.nodeEnv !== "development" || !env.enableWhatsappLocal) return;
  const client = await (whatsappService as any).initClient();
  console.log("✅ WhatsApp conectado");
  client.on("ready", () => {
    console.log("✅ WhatsApp listo para recibir mensajes");
  });
  client.on("message", async (msg: any) => {
    if (
      msg.isGroupMsg ||
      msg.isStatus ||
      msg.broadcast ||
      !msg.from.endsWith("@c.us")
    )
      return;
    const entry: WebhookEntry = {
      changes: [
        {
          value: {
            messages: [
              {
                from: msg.from.replace("@c.us", ""),
                type: "text",
                text: { body: msg.body },
              },
            ],
          },
        },
      ],
    };
    await handleMessage(entry).catch(console.error);
  });
}

export async function startServer(): Promise<void> {
  await connectRedis().catch((err) => {
    console.error("⚠️ No se pudo conectar a Redis al arrancar:", err);
  });

  let dbReady = false;
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión con PostgreSQL establecida exitosamente.");
    if (env.nodeEnv === "development") {
      await sequelize.sync({ alter: true });
      console.log("🔄 Tablas de la base de datos sincronizadas con éxito.");
    }
    dbReady = true;
  } catch (error) {
    console.error("❌ Error al conectar con PostgreSQL:", error);
    if (env.nodeEnv !== "development") {
      process.exit(1);
    }
  }

  await startWhatsappLocal().catch((error) => {
    console.error("Local WhatsApp client could not start:", error);
  });

  app.listen(env.port, () => {
    const suffix = dbReady ? "" : " (Sin conexión a BD)";
    console.log(
      `🚀 MiTurno API listening on port ${env.port} [${env.nodeEnv}]${suffix}`,
    );
  });
}

if (require.main === module) {
  void startServer();
}
