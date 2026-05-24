/**
 * Variables de entorno centralizadas para el backend.
 * Todas las rutas consumen desde aquí en lugar de process.env directamente.
 */

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  COOKIE_NAME: process.env.COOKIE_NAME ?? 'miturno_user',
  COOKIE_SECRET: process.env.COOKIE_SECRET ?? 'dev-secret-cambiame-en-prod',
} as const
