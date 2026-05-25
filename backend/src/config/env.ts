import * as dotenv from "dotenv";

const nodeEnv = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${nodeEnv}`, quiet: true });
dotenv.config({ quiet: true });

function numberValue(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  nodeEnv,
  port: numberValue(process.env.PORT, 3000),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  jwtSecret:
    process.env.JWT_SECRET ||
    "development-only-secret-change-before-production-123456",
  jwtExpiresSeconds: numberValue(process.env.JWT_EXPIRES_SECONDS, 7 * 24 * 60 * 60),
  cookieName: process.env.SESSION_COOKIE_NAME || "miturno_session",
  enableWhatsappLocal: process.env.ENABLE_WHATSAPP_LOCAL === "true",
  rateLimitWindowMs: numberValue(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: numberValue(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  wompiPrivateKey: process.env.WOMPI_PRIVATE_KEY,
  wompiEventsSecret: process.env.WOMPI_EVENTS_SECRET,
  wompiApiUrl: process.env.WOMPI_API_URL || "https://sandbox.wompi.co/v1",
  paymentRedirectUrl: process.env.PAYMENT_REDIRECT_URL,
};

if (
  env.nodeEnv === "production" &&
  env.jwtSecret.startsWith("development-only")
) {
  throw new Error("JWT_SECRET must be configured in production");
}
