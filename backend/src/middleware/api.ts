import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { HttpError } from "../utils/http";

type LimitRecord = { count: number; resetAt: number };
const requestsByIp = new Map<string, LimitRecord>();

export function apiHeaders(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigin = req.headers.origin === env.frontendUrl ? env.frontendUrl : undefined;
  if (allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.sendStatus(204);
    return;
  }
  next();
}

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  const key = req.ip || "unknown";
  const existing = requestsByIp.get(key);
  const record =
    !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + env.rateLimitWindowMs }
      : existing;
  record.count += 1;
  requestsByIp.set(key, record);
  res.setHeader("RateLimit-Limit", String(env.rateLimitMax));
  res.setHeader("RateLimit-Remaining", String(Math.max(0, env.rateLimitMax - record.count)));
  if (record.count > env.rateLimitMax) {
    next(new HttpError(429, "Demasiadas solicitudes. Intenta mas tarde."));
    return;
  }
  next();
}

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, `Ruta no encontrada: ${req.method} ${req.path}`));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = error instanceof HttpError ? error.status : 500;
  const message =
    error instanceof HttpError
      ? error.message
      : "Ocurrio un error interno al procesar la solicitud";
  if (status >= 500) console.error(error);
  res.status(status).json({ error: message });
}
