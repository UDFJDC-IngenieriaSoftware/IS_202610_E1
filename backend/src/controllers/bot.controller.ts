import whatsappService from "../whatsapp.factory";
import { BotState, UserSession, WebhookEntry } from "./bot.types";
export {
  WebhookEntry,
  WebhookChange,
  WebhookValue,
  WebhookMessage,
} from "./bot.types";
import { StateHandlers, sesionesActivas, FAQ } from "./bot.handlers";

export async function handleMessage(entry: WebhookEntry): Promise<void> {
  const change = entry.changes?.[0]?.value;
  const message = change?.messages?.[0];
  if (!message) return;

  const from = message.from;

  // 1. Obtener o inicializar la sesión del usuario
  let session = sesionesActivas.get(from);
  console.log("sesionesActivas", Object.fromEntries(sesionesActivas));

  if (!session) {
    session = {
      telefono: from,
      estadoActual: BotState.INICIO,
      datosTemporales: {},
    };
    sesionesActivas.set(from, session);
  }

  // 2. Procesar respuesta de lista interactiva (Meta API)
  if (message.type === "interactive") {
    const itemId = message.interactive?.list_reply?.id;
    if (itemId) {
      const respuesta = FAQ[itemId];
      if (respuesta) {
        await whatsappService.sendText(from, respuesta);
        await whatsappService.sendText(
          from,
          "👉 Escribe *menú* para regresar al inicio.",
        );
        return;
      }
    }
  }

  // 3. Procesar entrada de texto
  if (message.type === "text" && message.text) {
    const input = message.text.body.trim();
    const inputLower = input.toLowerCase();

    // Comandos de reinicio/menú global
    const globalTriggers = [
      "hola",
      "inicio",
      "menu",
      "menú",
      "ayuda",
      "help",
      "cancelar",
    ];
    if (globalTriggers.includes(inputLower)) {
      session.estadoActual = BotState.INICIO;
      session.datosTemporales = {};
      sesionesActivas.set(from, session);
      return whatsappService.sendMenu(from);
    }

    // 4. Enrutar el mensaje al handler del estado actual
    const handler =
      StateHandlers[session.estadoActual] || StateHandlers[BotState.INICIO];
    const responseText = await handler(session, input);

    // 5. Persistir el estado actualizado en el almacén de sesiones
    sesionesActivas.set(from, session);

    // 6. Enviar la respuesta por WhatsApp
    return whatsappService.sendText(from, responseText);
  }
}
