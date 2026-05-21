// app.js
require("dotenv").config();
const express = require("express");
const { handleMessage } = require("./src/bot.handler");

const app = express();
app.use(express.json());

// Verificación del webhook (Meta lo llama una vez)
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

// Recibir mensajes
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // responder rápido a Meta

  const entries = req.body?.entry ?? [];
  for (const entry of entries) {
    await handleMessage(entry).catch(console.error);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
