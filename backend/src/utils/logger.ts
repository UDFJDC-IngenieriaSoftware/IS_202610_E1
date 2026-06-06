import winston from "winston";

const isDev = process.env.NODE_ENV !== "production";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  format: isDev
    ? winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(
          ({ timestamp, level, message, correlationId, ...meta }) =>
            `[${timestamp}] ${level}: [${correlationId || "N/A"}] ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
            }`,
        ),
      )
    : winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
  defaultMeta: { service: "miturno-api" },
  transports: [new winston.transports.Console()],
});

export default logger;
