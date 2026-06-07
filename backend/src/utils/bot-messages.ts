// Mensajes compartidos del bot. Fuente única de verdad para que el menú
// quede sincronizado entre el controlador (bot.handlers) y los adaptadores
// de WhatsApp (whatsapp-local.service).

export const MENU_TEXT =
  `¿Qué deseas hacer?\n` +
  `*1.* ✂️ Agendar por barbero\n` +
  `*2.* ✂️ Agendar por servicio\n` +
  `*3.* 📋 Mis citas (cancelar / reprogramar)`;

// Saludo de bienvenida + menú. El nombre es opcional (los adaptadores no
// siempre lo conocen al momento de mostrar el menú).
export const buildMainMenu = (nombre?: string): string =>
  `👋 ¡Hola${nombre ? `, ${nombre}` : ""}! Bienvenido a *MiTurno* 💈\n\n${MENU_TEXT}`;
