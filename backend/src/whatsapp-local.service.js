// src/whatsapp-local.service.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

let client = null;

// ─── Inicializa el cliente una sola vez ───────────────────────
async function initClient() {
  if (client) return client;

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    },
  });

  client.on("qr", (qr) => {
    console.log("📱 Escanea el QR con tu WhatsApp:");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    console.log("✅ WhatsApp local conectado");
  });

  client.on("disconnected", () => {
    console.log("❌ WhatsApp desconectado");
    client = null;
  });

  await client.initialize();
  return client;
}

// ─── Interfaz idéntica a whatsapp.service.js ─────────────────
async function sendText(to, text) {
  const c = await initClient();
  const numberId = await c.getNumberId(to);
  if (!numberId) {
    console.warn(`⚠️ ${to} no está registrado en WhatsApp`);
    return;
  }
  return c.sendMessage(numberId._serialized, text);
}

async function sendMenu(to) {
  const menuText = `
🤖 *Asistente Virtual*
¿En qué puedo ayudarte hoy?

1️⃣ 🕐 Horarios
2️⃣ 💰 Precios
3️⃣ 📍 Ubicación
4️⃣ 📞 Contacto
  `.trim();

  return sendText(to, menuText);
}

module.exports = { sendText, sendMenu, initClient };
