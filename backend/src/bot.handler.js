const whatsappService = require("./whatsapp.factory");

const FAQ = {
  faq_horario: "🕐 Atendemos de Lunes a Viernes de 8am a 6pm.",
  faq_precio: "💰 Nuestros planes inician desde $50.000 COP.",
  faq_ubicacion: "📍 Estamos en Calle 123 #45-67, Bogotá.",
  faq_contacto: "📞 Llámanos al 300-123-4567 o escribe a soporte@empresa.com",
  fqa_servicios: {
    description: "servicios",
    callback: whatsappService.getServices,
  },
};

async function handleMessage(entry) {
  const change = entry.changes?.[0]?.value;
  const message = change?.messages?.[0];
  if (!message) return;

  const from = message.from;

  if (message.type === "text") {
    const texto = message.text.body.toLowerCase().trim();

    console.log(JSON.stringify({ texto }));

    const triggers = ["hola", "inicio", "menu", "menú", "ayuda", "help"];

    if (triggers.some((t) => texto.includes(t))) {
      return whatsappService.sendMenu(from);
    }

    if (
      texto === "2" ||
      texto.includes("precio") ||
      texto.includes("servicio")
    ) {
      return whatsappService.getServices(from);
    }

    // En dev — maneja opciones numéricas del menú de texto
    const opcionesTexto = {
      1: FAQ.faq_horario,
      3: FAQ.faq_ubicacion,
      4: FAQ.faq_contacto,
      5: FAQ.fqa_servicios,
    };

    const option = opcionesTexto[texto];
    if (option) {
      if (option.callback) {
        await option.callback(from);
      } else {
        await whatsappService.sendText(from, opcionesTexto[texto]);
      }
      return whatsappService.sendText(
        from,
        "¿Necesitas algo más? Escribe *menú* para volver.",
      );
    }

    return whatsappService.sendText(
      from,
      "👋 Escribe *hola* para ver el menú de opciones.",
    );
  }

  // Respuesta de lista interactiva (solo Meta API en prod)
  if (message.type === "interactive") {
    const itemId = message.interactive?.list_reply?.id;
    const respuesta = FAQ[itemId];

    if (respuesta) {
      await whatsappService.sendText(from, respuesta);
      return whatsappService.sendText(
        from,
        "¿Necesitas algo más? Escribe *menú* para volver.",
      );
    }
  }
}

module.exports = { handleMessage };
