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

  // ─── Obtener y Enviar Lista de Servicios (Meta API - Texto) ─────
  public async getServices(to: string): Promise<any> {
    const mockServicios = [
      { nombre: "Corte de Cabello Premium", precio: 25000, duracion: 30 },
      { nombre: "Barba y Toalla Caliente", precio: 15000, duracion: 20 },
      { nombre: "Combo Corte + Barba + Bebida", precio: 35000, duracion: 45 },
      { nombre: "Corte Infantil", precio: 18000, duracion: 25 },
      { nombre: "Lavado e Hidratación Capilar", precio: 12000, duracion: 15 },
    ];

    let mensaje = `💈 *Nuestros Servicios - MiTurno* 💈\n`;
    mensaje += `Aquí tienes el menú de servicios disponibles que puedes reservar:\n\n`;

    mockServicios.forEach((serv) => {
      const precioFormateado = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(serv.precio);

      mensaje += `🔹 *${serv.nombre}*\n`;
      mensaje += `   💵 Precio: ${precioFormateado}\n`;
      mensaje += `   ⏱️ Duración: ${serv.duracion} minutos\n\n`;
    });

    mensaje += `👉 Para agendar, escribe *menú* y elige la opción que prefieras para comunicarte con nosotros.`;

    return this.sendText(to, mensaje.trim());
  }
}
