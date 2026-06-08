import { NextFunction, Request, RequestHandler, Response } from "express";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function asyncHandler(
  handler: (req: any, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function requiredString(
  value: unknown,
  field: string,
  minLength = 1,
): string {
  if (typeof value !== "string" || value.trim().length < minLength) {
    throw new HttpError(400, `${field} es requerido`);
  }
  return value.trim();
}

export function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim();
}

export function requiredNumber(value: unknown, field: string, minimum = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum) {
    throw new HttpError(400, `${field} debe ser mayor o igual a ${minimum}`);
  }
  return parsed;
}

export function emailString(value: unknown, field = "email"): string {
  const email = requiredString(value, field, 5).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, `${field} no es valido`);
  }
  return email;
}

export function isoDate(value: unknown, field = "fecha"): string {
  const date = requiredString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpError(400, `${field} debe tener formato YYYY-MM-DD`);
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new HttpError(400, `${field} no es una fecha valida`);
  }
  return date;
}
