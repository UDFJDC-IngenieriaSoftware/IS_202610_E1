import whatsappService from "./whatsapp.factory";
import { ProcedureService } from "./services/procedure.service";
import { BarberService } from "./services/barber.service";
import { Servicio } from "./models";

const procedureService = new ProcedureService(new Servicio());
const barberService = new BarberService(new ProcedureService(new Servicio()));

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

    if (texto === "1") {
      const text = await barberService.getAllBarbers();
      console.log({ text });

      return whatsappService.sendText(from, text);
    }

    if (texto === "2") {
      const text = await barberService.getProcedures(
        "b0e86958-8686-4e38-967a-0e7845ef2001",
      );
      console.log({ text });
      return whatsappService.sendText(from, text);
    }

    if (texto === "3") {
      const text = await procedureService.getDescription(
        "a0e86958-8686-4e38-967a-0e7845ef2001",
      );
      console.log({ text });
      return whatsappService.sendText(from, text);
    }

    await whatsappService.sendText(
      from,
      "👋 Escribe *hola* para ver el menú de opciones.",
    );
    return;
  }

  // Respuesta de lista interactiva (solo Meta API en prod)
  if (message.type === "interactive") {
    const itemId = message.interactive?.list_reply?.id;
    if (itemId) {
      const respuesta = FAQ[itemId];

      if (respuesta) {
        await whatsappService.sendText(from, respuesta);
        await whatsappService.sendText(
          from,
          "¿Necesitas algo más? Escribe *menú* para volver.",
        );
        return;
      }
    }
  }
}
