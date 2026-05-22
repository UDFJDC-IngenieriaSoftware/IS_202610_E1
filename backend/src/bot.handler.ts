import whatsappService from "./whatsapp.factory";

export interface WebhookMessage {
  from: string;
  type: string;
  text?: { body: string };
  interactive?: {
    list_reply?: { id: string };
  };
}

export interface WebhookValue {
  messages?: WebhookMessage[];
}

export interface WebhookChange {
  value?: WebhookValue;
}

export interface WebhookEntry {
  changes?: WebhookChange[];
}

const FAQ: Record<string, string> = {
  faq_horario: "🕐 Atendemos de Lunes a Viernes de 8am a 6pm.",
  faq_precio: "💰 Nuestros planes inician desde $50.000 COP.",
  faq_ubicacion: "📍 Estamos en Calle 123 #45-67, Bogotá.",
  faq_contacto: "📞 Llámanos al 300-123-4567 o escribe a soporte@empresa.com",
};

export async function handleMessage(entry: WebhookEntry): Promise<void> {
  const change = entry.changes?.[0]?.value;
  const message = change?.messages?.[0];
  if (!message) return;

  const from = message.from;

  if (message.type === "text" && message.text) {
    const texto = message.text.body.toLowerCase().trim();

    console.log(JSON.stringify({ texto }));

    const triggers = ["hola", "inicio", "menu", "menú", "ayuda", "help"];

    if (triggers.some((t) => texto.includes(t))) {
      return whatsappService.sendMenu(from);
    }

    if (texto === "2" || texto.includes("precio") || texto.includes("servicio")) {
      return whatsappService.getServices(from);
    }

    // En dev — maneja opciones numéricas del menú de texto
    const opcionesTexto: Record<string, string> = {
      "1": FAQ.faq_horario,
      "3": FAQ.faq_ubicacion,
      "4": FAQ.faq_contacto,
    };

    if (opcionesTexto[texto]) {
      await whatsappService.sendText(from, opcionesTexto[texto]);
      await whatsappService.sendText(from, "¿Necesitas algo más? Escribe *menú* para volver.");
      return;
    }

    await whatsappService.sendText(from, "👋 Escribe *hola* para ver el menú de opciones.");
    return;
  }

  // Respuesta de lista interactiva (solo Meta API en prod)
  if (message.type === "interactive") {
    const itemId = message.interactive?.list_reply?.id;
    if (itemId) {
      const respuesta = FAQ[itemId];

      if (respuesta) {
        await whatsappService.sendText(from, respuesta);
        await whatsappService.sendText(from, "¿Necesitas algo más? Escribe *menú* para volver.");
        return;
      }
    }
  }
}
