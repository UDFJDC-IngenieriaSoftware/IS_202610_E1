// app.js
const env = process.env.NODE_ENV || "development";
require("dotenv").config({ path: `.env.${env}` });
require("dotenv").config(); // fallback a .env si falta alguna var

const express = require("express");
const { handleMessage } = require("./src/bot.handler");

const app = express();
app.use(express.json());

// ─── Solo en DEV — inicializa whatsapp-web.js ─────────────────
if (env === "development") {
  const { initClient } = require("./src/whatsapp-local.service");

  initClient().then((client) => {
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
  res.sendStatus(200);
  const entries = req.body?.entry ?? [];
  for (const entry of entries) {
    await handleMessage(entry).catch(console.error);
  }
});

app.get("/", (req, res) => {
  res.json({ status: "success", message: "funcionando!", env });
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT} [${env}]`);
});
