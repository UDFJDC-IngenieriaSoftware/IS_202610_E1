import express, { Request, Response } from "express";
import { handleMessage, WebhookEntry } from "./controllers/bot.controller";
import {
  apiHeaders,
  errorHandler,
  notFound,
  rateLimit,
} from "./middleware/api";
import { createApiRouter, createVersionedRouter } from "./routes";
import logger from "./utils/logger";
import { reminderJob } from "./jobs/reminder.job";
import { sequelize } from "./models";

export function createApp(): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // Start reminder job
  reminderJob.start(sequelize);

  app.use(correlationIdMiddleware);
  app.use(apiHeaders);
  app.use(express.json({ limit: "1mb" }));

  app.use((req: Request, res: Response, next) => {
    logger.info(`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    next();
  });

  // app.use("/api", rateLimit, createApiRouter());
  app.use(
    "/api",
    // rateLimit,
    createApiRouter(),
  );
  app.use("/api/v1", rateLimit, createVersionedRouter());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", service: "miturno-api" });
  });

  const verifyWebhook = (req: Request, res: Response): Response => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  };

  const receiveWebhook = async (req: Request, res: Response): Promise<void> => {
    console.log("receiveWebhook", JSON.stringify(req.body));

    res.sendStatus(200);
    const entries: WebhookEntry[] = req.body?.entry ?? [];
    for (const entry of entries) {
      await handleMessage(entry).catch(logger.error);
    }
  };

  app.get("/webhook", verifyWebhook);
  app.post("/webhook", receiveWebhook);
  app.get("/api/v1/webhook/whatsapp", verifyWebhook);
  app.post("/api/v1/webhook/whatsapp", receiveWebhook);

  app.get("/", (_req: Request, res: Response) => {
    res.json({ status: "success", message: "MiTurno API funcionando" });
  });

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export default createApp();
