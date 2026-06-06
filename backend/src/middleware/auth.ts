import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { AuthClaims, verifyToken } from "../services/auth.service";
import { HttpError } from "../utils/http";

export interface AuthenticatedRequest extends Request {
  auth?: AuthClaims;
}

function sessionToken(req: Request): string | undefined {
  const bearer = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (bearer) return bearer;
  const cookie = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === env.cookieName);
  return cookie?.[1] ? decodeURIComponent(cookie[1]) : undefined;
}

export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const token = sessionToken(req);
    if (!token) throw new HttpError(401, "Autenticacion requerida");
    req.auth = verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  if (req.auth?.rol !== "admin") {
    next(new HttpError(403, "Acceso de administrador requerido"));
    return;
  }
  next();
}
