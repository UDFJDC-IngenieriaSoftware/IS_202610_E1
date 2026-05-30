import { Client, LocalAuth } from "whatsapp-web.js";
import * as qrcode from "qrcode-terminal";
import * as fs from "fs";
import * as path from "path";
import { BaseWhatsAppService } from "./whatsapp.interface";

export class WhatsAppLocalService extends BaseWhatsAppService {
  private client: any = null;
  private isInitializing: boolean = false;

  constructor() {
    super();
  }

  // ─── Limpieza de archivos de bloqueo residuales de Chromium ────
  private deleteLockFiles(): void {
    const sessionDir = path.join(process.cwd(), ".wwebjs_auth", "session");
    const lockFiles = [
      path.join(sessionDir, "SingletonLock"),
      path.join(sessionDir, "SingletonCookie"),
      path.join(sessionDir, "SingletonSocket"),
      path.join(sessionDir, "Default", "SingletonLock"),
      path.join(sessionDir, "Default", "SingletonCookie"),
      path.join(sessionDir, "Default", "SingletonSocket"),
    ];

    lockFiles.forEach((file) => {
      try {
        fs.unlinkSync(file);
        console.log(
          `🧹 [Local Bot] Eliminado archivo de bloqueo residual de Chromium: ${file}`,
        );
      } catch (err) {
        // Ignorar si el archivo no existe o ya fue eliminado
      }
    });
  }

  // ─── Inicializa el cliente una sola vez ───────────────────────
  public async initClient(): Promise<any> {
    if (this.client) return this.client;

    // Evita inicializaciones en paralelo concurrentes
    if (this.isInitializing) {
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.client;
    }

    this.isInitializing = true;
    this.deleteLockFiles();

    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      },
    });

    this.client.on("qr", (qr: string) => {
      console.log("📱 Escanea el QR con tu WhatsApp:");
      qrcode.generate(qr, { small: true });
    });

    this.client.on("ready", () => {
      console.log("✅ WhatsApp local conectado (Clase)");
    });

    this.client.on("disconnected", () => {
      console.log("❌ WhatsApp local desconectado");
      this.client = null;
    });

    await this.client.initialize();
    this.isInitializing = false;
    return this.client;
  }

  public async toText() {}

  // ─── Enviar mensaje de texto simple ───────────────────────────
  public async sendText(to: string, text: string): Promise<any> {
    const c = await this.initClient();
    const numberId = await c.getNumberId(to);
    if (!numberId) {
      console.warn(`⚠️ ${to} no está registrado en WhatsApp`);
      return;
    }
    return c.sendMessage(numberId._serialized, text);
  }

  // ─── Enviar menú interactivo (texto formateado) ───────────────
  public async sendMenu(to: string): Promise<any> {
    const menuText = `
🤖 *Asistente Virtual*
¿En qué puedo ayudarte hoy?

1️⃣ 🕐 Lista de Barberos
2 🕐 Lista de servicios
    `.trim();

    return this.sendText(to, menuText);
  }
}
