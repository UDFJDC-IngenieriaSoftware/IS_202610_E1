import axios from "axios";
import { BaseWhatsAppService } from "./whatsapp.interface";

export class WhatsAppCloudService extends BaseWhatsAppService {
  constructor() {
    super();
  }

  // Obtiene los headers y url dinámicamente según las variables de entorno actuales
  private getConfig(): { url: string; headers: Record<string, string> } {
    return {
      url: `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    };
  }

  // ─── Enviar mensaje de texto simple (Meta API) ────────────────
  public async sendText(to: string, text: string): Promise<any> {
    const { headers, url } = this.getConfig();
    return axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      },
      { headers }
    );
  }

  // ─── Enviar lista interactiva (Menú - Meta API) ───────────────
  public async sendMenu(to: string): Promise<any> {
    const { url, headers } = this.getConfig();
    return axios.post(
      url,
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
      { headers }
    );
  }

}
