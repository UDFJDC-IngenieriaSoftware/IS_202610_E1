// src/whatsapp-mock.service.js
const BaseWhatsAppService = require("./whatsapp.interface");

class WhatsAppMockService extends BaseWhatsAppService {
  constructor() {
    super();
  }

  // ─── Enviar mensaje de texto simple (Mock offline) ────────────
  async sendText(to, text) {
    console.log(`💬 [Mock Bot a ${to}]: ${text}`);
  }

  // ─── Enviar menú (Mock offline) ───────────────────────────────
  async sendMenu(to) {
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

  // ─── Obtener y Enviar Lista de Servicios (Mock offline) ────────
  async getServices(to) {
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

module.exports = WhatsAppMockService;
