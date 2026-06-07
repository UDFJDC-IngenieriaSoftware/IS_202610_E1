import logger from "../utils/logger";
import whatsappService from "../whatsapp.factory";

interface NotificationContext {
  customerName: string;
  customerPhone: string;
  barberName: string;
  serviceName: string;
  dateTime: string;
  bookingId: number;
}

export class NotificationService {
  private whatsapp = whatsappService;

  async sendBookingConfirmation(context: NotificationContext): Promise<void> {
    try {
      const message = this.getConfirmationTemplate(context);
      await this.whatsapp.sendText(context.customerPhone, message);
      logger.info(`Booking confirmation sent to ${context.customerPhone}`, {
        bookingId: context.bookingId,
      });
    } catch (error) {
      logger.error(`Failed to send booking confirmation`, {
        bookingId: context.bookingId,
        error: String(error),
      });
      throw error;
    }
  }

  async sendReminder24h(context: NotificationContext): Promise<void> {
    try {
      const message = this.getReminder24hTemplate(context);
      await this.whatsapp.sendText(context.customerPhone, message);
      logger.info(`24h reminder sent to ${context.customerPhone}`, {
        bookingId: context.bookingId,
      });
    } catch (error) {
      logger.error(`Failed to send 24h reminder`, {
        bookingId: context.bookingId,
        error: String(error),
      });
      throw error;
    }
  }

  async sendReminder2h(context: NotificationContext): Promise<void> {
    try {
      const message = this.getReminder2hTemplate(context);
      await this.whatsapp.sendText(context.customerPhone, message);
      logger.info(`2h reminder sent to ${context.customerPhone}`, {
        bookingId: context.bookingId,
      });
    } catch (error) {
      logger.error(`Failed to send 2h reminder`, {
        bookingId: context.bookingId,
        error: String(error),
      });
      throw error;
    }
  }

  async sendCancellation(context: NotificationContext): Promise<void> {
    try {
      const message = this.getCancellationTemplate(context);
      await this.whatsapp.sendText(context.customerPhone, message);
      logger.info(
        `Cancellation notification sent to ${context.customerPhone}`,
        {
          bookingId: context.bookingId,
        },
      );
    } catch (error) {
      logger.error(`Failed to send cancellation notification`, {
        bookingId: context.bookingId,
        error: String(error),
      });
      throw error;
    }
  }

  private getConfirmationTemplate(context: NotificationContext): string {
    return `¡Hola ${context.customerName}! 👋

Tu cita ha sido confirmada:

📌 Peluquero: ${context.barberName}
✂️ Servicio: ${context.serviceName}
📅 Fecha y hora: ${context.dateTime}

Te esperamos. En caso de duda, responde a este mensaje.
`;
  }

  private getReminder24hTemplate(context: NotificationContext): string {
    return `¡Hola ${context.customerName}! 👋

Te recordamos que tienes una cita mañana:

📌 Peluquero: ${context.barberName}
✂️ Servicio: ${context.serviceName}
📅 Hora: ${context.dateTime}

Si no puedes asistir, por favor cancela aquí para que otro cliente pueda agendar.
`;
  }

  private getReminder2hTemplate(context: NotificationContext): string {
    return `¡Hola ${context.customerName}! 👋

Te recordamos que tu cita es en 2 horas:

📌 Peluquero: ${context.barberName}
✂️ Servicio: ${context.serviceName}
📅 Hora: ${context.dateTime}

Te esperamos en la barbería.
`;
  }

  private getCancellationTemplate(context: NotificationContext): string {
    return `¡Hola ${context.customerName}! 👋

Tu cita ha sido cancelada:

📌 Peluquero: ${context.barberName}
✂️ Servicio: ${context.serviceName}
📅 Fecha y hora que fue: ${context.dateTime}

Si fue por error, contacta con nosotros para reagendar.
`;
  }
}

export const notificationService = new NotificationService();
