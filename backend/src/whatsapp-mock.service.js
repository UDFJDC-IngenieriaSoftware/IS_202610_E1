// src/whatsapp-mock.service.js

async function sendText(to, text) {
  console.log(`💬 [Bot a ${to}]: ${text}`);
}

async function sendMenu(to) {
  const menuText = `
🤖 *Asistente Virtual*
¿En qué puedo ayudarte hoy?

1️⃣ 🕐 Horarios
2️⃣ 💰 Precios
3️⃣ 📍 Ubicación
4️⃣ 📞 Contacto test
  `.trim();

  return sendText(to, menuText);
}

module.exports = { sendText, sendMenu };
