import { BaseWhatsAppService } from "./whatsapp.interface";

export class WhatsAppMockService extends BaseWhatsAppService {
  constructor() {
    super();
  }

  // ─── Enviar mensaje de texto simple (Mock offline) ────────────
  public async sendText(to: string, text: string): Promise<any> {
    console.log(`💬 [Mock Bot a ${to}]: ${text}`);
  }

  // ─── Enviar menú (Mock offline) ───────────────────────────────
  public async sendMenu(to: string): Promise<any> {
    const menuText = `
🤖 *Asistente Virtual*
¿En qué puedo ayudarte hoy?

1️⃣ 🕐 Horarios
2️⃣ 💰 Precios
3️⃣ 📍 Ubicación
4️⃣ 📞 Contacto test
    `.trim();

    return this.sendText(to, menuText);
  }
}
