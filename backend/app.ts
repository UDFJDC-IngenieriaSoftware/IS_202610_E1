import { env } from "./src/config/env";
import { sequelize } from "./src/models";
import app from "./src/app";
import { handleMessage, WebhookEntry } from "./src/controllers/bot.controller";
import whatsappService from "./src/whatsapp.factory";

export { app };

async function startWhatsappLocal(): Promise<void> {
  if (!env.enableWhatsappLocal) return;
  const client = await (whatsappService as any).initClient();
  client.on("message", async (msg: any) => {
    if (msg.isGroupMsg || msg.isStatus || msg.broadcast) return;
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
  try {
    await sequelize.authenticate();
    if (env.nodeEnv === "development" && process.env.DB_SYNC === "true") {
      await sequelize.sync({ alter: true });
    }
    console.log("Database connection established.");
  } catch (error) {
    console.error("Database unavailable:", error);
    if (env.nodeEnv !== "development") throw error;
  }

  await startWhatsappLocal().catch((error) => {
    console.error("Local WhatsApp client could not start:", error);
  });
  app.listen(env.port, () => {
    console.log(`MiTurno API listening on port ${env.port} [${env.nodeEnv}]`);
  });
}

if (require.main === module) {
  void startServer();
}
