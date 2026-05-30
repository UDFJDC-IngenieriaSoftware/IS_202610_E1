import cron, { ScheduledTask } from "node-cron";
import logger from "../utils/logger";
import { notificationService } from "../services/notification.service";

interface BookingRow {
  id: number;
  date: string;
  time: string;
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
      const now = new Date();
      const bookings = await sequelize.query(
        `
        SELECT
          b.id,
          b.date,
          b.time,
          c.phone as customer_phone,
          c.name as customer_name,
          u.name as barber_name,
          s.name as service_name,
          b.reminder_24h_sent,
          b.reminder_2h_sent
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN users u ON b.barber_id = u.id
        JOIN services s ON b.service_id = s.id
        WHERE b.status = 'confirmed'
          AND (
            (b.reminder_24h_sent = false AND EXTRACT(EPOCH FROM (to_timestamp(b.date || ' ' || b.time, 'YYYY-MM-DD HH24:MI') - NOW())) BETWEEN 82800 AND 88200)
            OR
            (b.reminder_2h_sent = false AND EXTRACT(EPOCH FROM (to_timestamp(b.date || ' ' || b.time, 'YYYY-MM-DD HH24:MI') - NOW())) BETWEEN 6300 AND 7500)
          )
        `,
        { type: sequelize.QueryTypes.SELECT }
      );

      for (const booking of bookings as BookingRow[]) {
        const dateTime = `${booking.date} ${booking.time}`;
        const context = {
          customerName: booking.customer_name,
          customerPhone: booking.customer_phone,
          barberName: booking.barber_name,
          serviceName: booking.service_name,
          dateTime,
          bookingId: booking.id,
        };

        if (!booking.reminder_24h_sent) {
          await notificationService.sendReminder24h(context);
          await sequelize.query(
            "UPDATE bookings SET reminder_24h_sent = true WHERE id = ?",
            { replacements: [booking.id] }
          );
        }

        if (!booking.reminder_2h_sent) {
          await notificationService.sendReminder2h(context);
          await sequelize.query(
            "UPDATE bookings SET reminder_2h_sent = true WHERE id = ?",
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
