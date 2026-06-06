import cron, { ScheduledTask } from "node-cron";
import logger from "../utils/logger";
import { notificationService } from "../services/notification.service";

interface BookingRow {
  id: string;
  fecha_hora: string;
  customer_phone: string;
  customer_name: string;
  barber_name: string;
  service_name: string;
  reminder_24h_sent: boolean;
  reminder_2h_sent: boolean;
}

export class ReminderJob {
  private task: ScheduledTask | null = null;

  start(sequelize: any): void {
    if (process.env.NODE_ENV === "test") {
      logger.info("Reminder job skipped in test mode");
      return;
    }

    this.task = cron.schedule("*/15 * * * *", async () => {
      try {
        await this.processReminders(sequelize);
      } catch (error) {
        logger.error("Error processing reminders", { error: String(error) });
      }
    });

    logger.info("Reminder job started (runs every 15 minutes)");
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      logger.info("Reminder job stopped");
    }
  }

  private async processReminders(sequelize: any): Promise<void> {
    try {
      const bookings = await sequelize.query(
        `
        SELECT
          c.id,
          to_char(h.fecha + h.hora_inicio, 'YYYY-MM-DD HH24:MI') AS fecha_hora,
          cl.celular AS customer_phone,
          cl.nombres || ' ' || cl.apellidos AS customer_name,
          b.nombres || ' ' || b.apellidos AS barber_name,
          s.nombre AS service_name,
          c.reminder_24h_sent,
          c.reminder_2h_sent
        FROM citas c
        JOIN horarios h ON c.id_horario = h.id
        JOIN clientes cl ON c.id_cliente = cl.id
        JOIN servicios s ON h.id_servicio = s.id
        JOIN barberos b ON s.id_barbero = b.id
        WHERE c.estado = 'confirmada'
          AND (
            (c.reminder_24h_sent = false AND EXTRACT(EPOCH FROM ((h.fecha + h.hora_inicio)::timestamptz - NOW())) BETWEEN 82800 AND 88200)
            OR
            (c.reminder_2h_sent = false AND EXTRACT(EPOCH FROM ((h.fecha + h.hora_inicio)::timestamptz - NOW())) BETWEEN 6300 AND 7500)
          )
        `,
        { type: sequelize.QueryTypes.SELECT }
      );

      for (const booking of bookings as BookingRow[]) {
        const dateTime = booking.fecha_hora;
        const context = {
          customerName: booking.customer_name,
          customerPhone: booking.customer_phone,
          barberName: booking.barber_name,
          serviceName: booking.service_name,
          dateTime,
          bookingId: booking.id as any,
        };

        if (!booking.reminder_24h_sent) {
          await notificationService.sendReminder24h(context);
          await sequelize.query(
            "UPDATE citas SET reminder_24h_sent = true WHERE id = ?",
            { replacements: [booking.id] }
          );
        }

        if (!booking.reminder_2h_sent) {
          await notificationService.sendReminder2h(context);
          await sequelize.query(
            "UPDATE citas SET reminder_2h_sent = true WHERE id = ?",
            { replacements: [booking.id] }
          );
        }
      }

      if (bookings.length > 0) {
        logger.info(`Processed ${bookings.length} booking reminders`);
      }
    } catch (error) {
      logger.error("Error in processReminders", { error: String(error) });
      throw error;
    }
  }
}

export const reminderJob = new ReminderJob();
