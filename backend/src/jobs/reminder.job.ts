import cron, { ScheduledTask } from "node-cron";
import logger from "../utils/logger";
import { notificationService } from "../services/notification.service";
import { Notificacion } from "../models";

const MAX_RETRIES = 2;

interface BookingRow {
  id: string;
  fecha_hora: string;
  customer_phone: string;
  customer_name: string;
  barber_name: string;
  service_name: string;
  reminder_24h_sent: boolean;
  reminder_2h_sent: boolean;
  reminder_24h_retries: number;
  reminder_2h_retries: number;
  due_24h: boolean;
  due_2h: boolean;
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

  async processReminders(sequelize: any): Promise<void> {
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
          c.reminder_2h_sent,
          COALESCE(c.reminder_24h_retries, 0) AS reminder_24h_retries,
          COALESCE(c.reminder_2h_retries,  0) AS reminder_2h_retries,
          (
            c.reminder_24h_sent = false
            AND COALESCE(c.reminder_24h_retries, 0) < ${MAX_RETRIES}
            AND EXTRACT(EPOCH FROM ((h.fecha + h.hora_inicio)::timestamptz - NOW())) BETWEEN 82800 AND 88200
          ) AS due_24h,
          (
            c.reminder_2h_sent = false
            AND COALESCE(c.reminder_2h_retries, 0) < ${MAX_RETRIES}
            AND EXTRACT(EPOCH FROM ((h.fecha + h.hora_inicio)::timestamptz - NOW())) BETWEEN 6300 AND 7500
          ) AS due_2h
        FROM citas c
        JOIN horarios h ON c.id_horario = h.id
        JOIN clientes cl ON c.id_cliente = cl.id
        JOIN servicios s ON h.id_servicio = s.id
        JOIN barberos b ON s.id_barbero = b.id
        WHERE c.estado = 'confirmada'
          AND (
            (
              c.reminder_24h_sent = false
              AND COALESCE(c.reminder_24h_retries, 0) < ${MAX_RETRIES}
              AND EXTRACT(EPOCH FROM ((h.fecha + h.hora_inicio)::timestamptz - NOW())) BETWEEN 82800 AND 88200
            )
            OR
            (
              c.reminder_2h_sent = false
              AND COALESCE(c.reminder_2h_retries, 0) < ${MAX_RETRIES}
              AND EXTRACT(EPOCH FROM ((h.fecha + h.hora_inicio)::timestamptz - NOW())) BETWEEN 6300 AND 7500
            )
          )
        `,
        { type: sequelize.QueryTypes.SELECT },
      );

      logger.info(`bookings ${bookings}`);

      for (const booking of bookings as BookingRow[]) {
        const context = {
          customerName: booking.customer_name,
          customerPhone: booking.customer_phone,
          barberName: booking.barber_name,
          serviceName: booking.service_name,
          dateTime: booking.fecha_hora,
          bookingId: booking.id as any,
        };

        if (booking.due_24h) {
          await this.sendWithRetry(sequelize, booking, "24h", () =>
            notificationService.sendReminder24h(context),
          );
        }

        if (booking.due_2h) {
          await this.sendWithRetry(sequelize, booking, "2h", () =>
            notificationService.sendReminder2h(context),
          );
        }
      }

      if ((bookings as BookingRow[]).length > 0) {
        logger.info(
          `Processed ${(bookings as BookingRow[]).length} booking reminders`,
        );
      }
    } catch (error) {
      logger.error("Error in processReminders", { error: String(error) });
      throw error;
    }
  }

  private async sendWithRetry(
    sequelize: any,
    booking: BookingRow,
    tipo: "24h" | "2h",
    send: () => Promise<void>,
  ): Promise<void> {
    const sentCol = tipo === "24h" ? "reminder_24h_sent" : "reminder_2h_sent";
    const retriesCol =
      tipo === "24h" ? "reminder_24h_retries" : "reminder_2h_retries";
    const currentRetries =
      tipo === "24h"
        ? booking.reminder_24h_retries
        : booking.reminder_2h_retries;

    try {
      await send();

      // Éxito: marcar como enviado y persistir en Notificacion
      await sequelize.query(`UPDATE citas SET ${sentCol} = true WHERE id = ?`, {
        replacements: [booking.id],
      });
      await Notificacion.create({
        mensaje: `Recordatorio ${tipo} enviado`,
        tipo: `recordatorio_${tipo}`,
        idCita: booking.id,
      });
      logger.info(`${tipo} reminder sent and persisted`, {
        bookingId: booking.id,
      });
    } catch (error) {
      const newRetries = currentRetries + 1;

      if (newRetries >= MAX_RETRIES) {
        // Máximo de reintentos alcanzado: marcar como enviado para no reintentar
        await sequelize.query(
          `UPDATE citas SET ${sentCol} = true, ${retriesCol} = ? WHERE id = ?`,
          { replacements: [newRetries, booking.id] },
        );
        logger.warn(`Max retries reached for ${tipo} reminder, giving up`, {
          bookingId: booking.id,
          retries: newRetries,
        });
      } else {
        // Reintento pendiente: solo incrementar contador
        await sequelize.query(
          `UPDATE citas SET ${retriesCol} = ? WHERE id = ?`,
          { replacements: [newRetries, booking.id] },
        );
        logger.warn(
          `${tipo} reminder failed, will retry (attempt ${newRetries})`,
          {
            bookingId: booking.id,
          },
        );
      }

      // Persiste el error para trazabilidad
      await Notificacion.create({
        mensaje: `Error al enviar recordatorio ${tipo}: ${String(error)}`,
        tipo: `recordatorio_${tipo}_fallido`,
        idCita: booking.id,
      });
    }
  }
}

export const reminderJob = new ReminderJob();
