// src/whatsapp.service.js
const axios = require("axios");

const BASE_URL = `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`;
const HEADERS = {
  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
  "Content-Type": "application/json",
};

// Enviar mensaje de texto simple
async function sendText(to, text) {
  return axios.post(
    BASE_URL,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    },
    { headers: HEADERS },
  );
}

// Enviar lista interactiva (menú)
async function sendMenu(to) {
  return axios.post(
    BASE_URL,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: "🤖 Asistente Virtual" },
        body: { text: "¿En qué puedo ayudarte hoy?" },
        footer: { text: "Selecciona una opción" },
        action: {
          button: "Ver opciones",
          sections: [
            {
              title: "Información",
              rows: [
                {
                  id: "faq_horario",
                  title: "🕐 Horarios",
                  description: "Ver nuestros horarios",
                },
                {
                  id: "faq_precio",
                  title: "💰 Precios",
                  description: "Consultar tarifas",
                },
                {
                  id: "faq_ubicacion",
                  title: "📍 Ubicación",
                  description: "Cómo llegar",
                },
                {
                  id: "faq_contacto",
                  title: "📞 Contacto",
                  description: "Hablar con un agente",
                },
              ],
            },
          ],
        },
      },
    },
    { headers: HEADERS },
  );
}

module.exports = { sendText, sendMenu };
