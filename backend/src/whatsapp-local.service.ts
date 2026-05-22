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
        console.log(`🧹 [Local Bot] Eliminado archivo de bloqueo residual de Chromium: ${file}`);
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
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
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

1️⃣ 🕐 Horarios
2️⃣ 💰 Precios
3️⃣ 📍 Ubicación
4️⃣ 📞 Contacto
    `.trim();

    return this.sendText(to, menuText);
  }

  // ─── Obtener y Enviar Lista de Servicios (Mock) ───────────────
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
