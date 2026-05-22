// src/whatsapp-local.service.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const { mock } = require("node:test");

let client = null;

// ─── Limpieza de archivos de bloqueo residuales de Chromium ────
function deleteLockFiles() {
  const sessionDir = path.join(process.cwd(), ".wwebjs_auth", "session");
  const lockFiles = [
    path.join(sessionDir, "SingletonLock"),
    path.join(sessionDir, "SingletonCookie"),
    path.join(sessionDir, "SingletonSocket"),
    path.join(sessionDir, "Default", "SingletonLock"),
    path.join(sessionDir, "Default", "SingletonCookie"),
    path.join(sessionDir, "Default", "SingletonSocket"),
  ];

  lockFiles.forEach((file) => {
    try {
      // Eliminación directa (a veces SingletonLock es un symlink roto y fs.existsSync da false pero sigue ahí)
      fs.unlinkSync(file);
      console.log(
        `🧹 Eliminado archivo de bloqueo residual de Chromium: ${file}`,
      );
    } catch (err) {
      // Ignorar si el archivo no existe o ya fue eliminado
    }
  });
}

// ─── Inicializa el cliente una sola vez ───────────────────────
async function initClient() {
  if (client) return client;

  // Limpiar bloqueos antes de iniciar Puppeteer
  deleteLockFiles();

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
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
4️⃣ 📞 Contacto develop
  `.trim();

  return sendText(to, menuText);
}

async function sendTimeSlots() {
  const mockTimeSlot = {
    id: 4,
    fecha: "2026-10-2",
    horaInicio: "08:00:00",
    horaFin: "09:00:00",
    disponible: true,
  };
  const mockSlots = [mockTimeSlot, mockTimeSlot, mockTimeSlot];

  return;
}

async function getServices(to) {
  console.log("getServices");

  const serviceMock = {
    id: 2,
    nombre: "Carlos Alarcón",
    precio: 40e3,
    duracion: 60,
  };
  const services = [serviceMock, serviceMock, serviceMock];

  const text = services
    .map((s) => s.nombre)
    .map((s) => `servicio: ${s}`)
    .join(" \n");

  return sendText(to, text);
}

module.exports = { sendText, sendMenu, initClient, getServices };
