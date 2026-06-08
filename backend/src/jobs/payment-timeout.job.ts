import cron, { ScheduledTask } from "node-cron";
import { Op } from "sequelize";
import logger from "../utils/logger";
import { Cita, Pago } from "../models";

export class PaymentTimeoutJob {
  private task: ScheduledTask | null = null;

  start(): void {
    if (process.env.NODE_ENV === "test") {
      logger.info("Payment timeout job skipped in test mode");
      return;
    }

    this.task = cron.schedule("*/5 * * * *", async () => {
      try {
        await this.cancelExpiredPayments();
      } catch (error) {
        logger.error("Error in payment timeout job", { error: String(error) });
      }
    });

    logger.info("Payment timeout job started (runs every 5 minutes)");
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      logger.info("Payment timeout job stopped");
    }
  }

  async cancelExpiredPayments(): Promise<number> {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);

    const expiredCitas = (await Cita.findAll({
      where: {
        estado: "pendiente",
        createdAt: { [Op.lt]: cutoff },
      },
      include: [
        { model: Pago, as: "pagos", where: { estado: "pendiente" }, required: false },
      ],
    })) as any[];

    let count = 0;
    for (const cita of expiredCitas) {
      try {
        await cita.update({ estado: "cancelada" });
        for (const pago of cita.pagos ?? []) {
          await pago.update({ estado: "fallido" });
        }
        count++;
        logger.info("Auto-cancelled expired pending cita", { citaId: cita.id });
      } catch (error) {
        logger.error("Error cancelling expired cita", {
          citaId: cita.id,
          error: String(error),
        });
      }
    }

    if (count > 0) {
      logger.info(`Payment timeout job: cancelled ${count} expired pending citas`);
    }

    return count;
  }
}

export const paymentTimeoutJob = new PaymentTimeoutJob();
