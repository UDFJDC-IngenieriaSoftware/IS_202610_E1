// app.js
const env = process.env.NODE_ENV || "development";
require("dotenv").config({ path: `.env.${env}` });
require("dotenv").config(); // fallback a .env si falta alguna var

const express = require("express");
const { handleMessage } = require("./src/bot.handler");
const { sequelize } = require("./src/models");

const app = express();
app.use(express.json());

// ─── Solo en DEV — inicializa whatsapp-web.js ─────────────────
if (env === "development") {
  const whatsappService = require("./src/whatsapp.factory");

  whatsappService.initClient().then((client) => {
    // Escucha mensajes entrantes directo de WhatsApp Web
    client.on("message", async (msg) => {
      if (msg.isGroupMsg || msg.isStatus || msg.broadcast) return;

      // Adapta el formato al mismo que usa bot.handler.js
      const fakeEntry = {
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
  });
}

// ─── Webhook para Meta API (prod) ────────────────────────────
app.get("/webhook", (req, res) => {
  const {
    "hub.mode": mode,
    "hub.verify_token": token,
    "hub.challenge": challenge,
  } = req.query;
  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("✅ Webhook verificado");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  console.log("POST webhook");

  res.sendStatus(200);
  const entries = req.body?.entry ?? [];
  for (const entry of entries) {
    await handleMessage(entry).catch(console.error);
  }
});

app.get("/", (req, res) => {
  res.json({ status: "success", message: "funcionando!", env });
});

// ─── Conexión e Inicialización de la Base de Datos ──────────────────────
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
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT} [${env}]`);
    });
  })
  .catch((err) => {
    console.error(
      "❌ Error al iniciar la aplicación o conectar con PostgreSQL:",
      err,
    );
    // En producción se podría forzar el cierre del proceso si la BD falla
    if (env !== "development") {
      process.exit(1);
    } else {
      // En desarrollo levantamos el servidor de todos modos para que el desarrollador pueda depurar
      app.listen(process.env.PORT, () => {
        console.log(
          `🚀 Server running on port ${process.env.PORT} [${env}] (Sin conexión a BD)`,
        );
      });
    }
  });
