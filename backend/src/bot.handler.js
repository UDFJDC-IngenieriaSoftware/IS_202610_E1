// src/bot.handler.js
const { sendText, sendMenu } = require("./whatsapp.service");

const FAQ = {
  faq_horario: "🕐 Atendemos de Lunes a Viernes de 8am a 6pm.",
  faq_precio: "💰 Nuestros planes inician desde $50.000 COP.",
  faq_ubicacion: "📍 Estamos en Calle 123 #45-67, Bogotá.",
  faq_contacto: "📞 Llámanos al 300-123-4567 o escribe a soporte@empresa.com",
};

async function handleMessage(entry) {
  const change = entry.changes?.[0]?.value;
  const message = change?.messages?.[0];
  if (!message) return;

  const from = message.from; // número del usuario

  // Mensaje de texto
  if (message.type === "text") {
    const texto = message.text.body.toLowerCase().trim();
    const triggers = ["hola", "inicio", "menu", "menú", "ayuda", "help"];

    if (triggers.some((t) => texto.includes(t))) {
      return sendMenu(from);
    }
    return sendText(from, "👋 Escribe *hola* para ver el menú de opciones.");
  }

  // Respuesta de lista interactiva
  if (message.type === "interactive") {
    const itemId = message.interactive?.list_reply?.id;
    const respuesta = FAQ[itemId];

    if (respuesta) {
      await sendText(from, respuesta);
      return sendText(from, "¿Necesitas algo más? Escribe *menú* para volver.");
    }
  }
}

module.exports = { handleMessage };
