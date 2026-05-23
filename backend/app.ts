import * as dotenv from "dotenv";
const env = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${env}` });
dotenv.config(); // fallback a .env si falta alguna var

import express, { Request, Response } from "express";
import { handleMessage, WebhookEntry } from "./src/controllers/bot.controller";
import { sequelize } from "./src/models";
import whatsappService from "./src/whatsapp.factory";

const app = express();
app.use(express.json());

// ─── Solo en DEV — inicializa whatsapp-web.js ─────────────────
if (env === "development") {
  (whatsappService as any).initClient().then((client: any) => {
    // Escucha mensajes entrantes directo de WhatsApp Web
    client.on("message", async (msg: any) => {
      if (msg.isGroupMsg || msg.isStatus || msg.broadcast) return;

      // Adapta el formato al mismo que usa bot.controller.ts
      const fakeEntry: WebhookEntry = {
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

      await handleMessage(fakeEntry).catch(console.error);
    });
  }).catch(console.error);
}

// ─── Webhook para Meta API (prod) ────────────────────────────
app.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("✅ Webhook verificado");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post("/webhook", async (req: Request, res: Response) => {
  console.log("POST webhook");

  res.sendStatus(200);
  const entries: WebhookEntry[] = req.body?.entry ?? [];
  for (const entry of entries) {
    await handleMessage(entry).catch(console.error);
  }
});

app.get("/", (req: Request, res: Response) => {
  res.json({ status: "success", message: "funcionando!", env });
});

// ─── Conexión e Inicialización de la Base de Datos ──────────────────────
const PORT = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Conexión con PostgreSQL establecida exitosamente.");

    // Sincroniza tablas automáticamente en desarrollo para comodidad del programador
    if (env === "development") {
      return sequelize.sync({ alter: true }).then(() => {
        console.log("🔄 Tablas de la base de datos sincronizadas con éxito.");
      });
    }
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} [${env}]`);
    });
  })
  .catch((err: any) => {
    console.error(
      "❌ Error al iniciar la aplicación o conectar con PostgreSQL:",
      err,
    );
    // En producción se podría forzar el cierre del proceso si la BD falla
    if (env !== "development") {
      process.exit(1);
    } else {
      // En desarrollo levantamos el servidor de todos modos para que el desarrollador pueda depurar
      app.listen(PORT, () => {
        console.log(
          `🚀 Server running on port ${PORT} [${env}] (Sin conexión a BD)`,
        );
      });
    }
  });
