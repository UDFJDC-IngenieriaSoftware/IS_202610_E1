import { Request, Response } from "express";
import { env } from "../config/env";
import { AuthenticatedRequest } from "../middleware/auth";
import { Barbero } from "../models";
import {
  AuthService,
  hashPassword,
  signToken,
  toProfile,
  verifyPassword,
} from "../services/auth.service";
import { emailString, HttpError, optionalString, requiredString } from "../utils/http";

const authService = new AuthService();

function setSessionCookie(res: Response, token: string): void {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    maxAge: env.jwtExpiresSeconds * 1000,
    path: "/",
  });
}

function authResponse(user: Barbero, token: string) {
  return { token, perfil: toProfile(user), rol: user.rol };
}

export async function register(req: Request, res: Response): Promise<void> {
  const body = req.body || {};
  const shop = body.barbershop || body.barberia || {};
  const user = await authService.register({
    nombres: requiredString(body.nombres ?? body.name ?? body.nombre, "nombres", 2),
    apellidos: requiredString(body.apellidos ?? body.apellido ?? "Propietario", "apellidos", 2),
    email: emailString(body.email),
    celular: requiredString(body.celular ?? body.phone ?? body.whatsapp, "celular", 7),
    password: requiredString(body.password, "password", 8),
    barberia: optionalString(shop.name ?? shop.nombre ?? body.nombreBarberia),
    ciudad: optionalString(shop.city ?? shop.ciudad ?? body.ciudad),
    direccion: optionalString(shop.address ?? shop.direccion ?? body.direccion),
    plan: ["solo", "pro", "estudio"].includes(body.plan) ? body.plan : undefined,
  });
  const token = signToken(user);
  setSessionCookie(res, token);
  res.status(201).json(authResponse(user, token));
}

export async function login(req: Request, res: Response): Promise<void> {
  const email = emailString(req.body?.email);
  const password = requiredString(req.body?.password, "password", 1);
  const user = await authService.login(email, password);
  const token = signToken(user);
  setSessionCookie(res, token);
  res.json(authResponse(user, token));
}

export async function refresh(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await currentUser(req);
  const token = signToken(user);
  setSessionCookie(res, token);
  res.json(authResponse(user, token));
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie(env.cookieName, { path: "/" });
  res.status(204).send();
}

async function currentUser(req: AuthenticatedRequest): Promise<Barbero> {
  const user = await Barbero.findByPk(req.auth?.sub);
  if (!user || !user.activo) throw new HttpError(401, "Usuario no disponible");
  return user;
}

export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json(toProfile(await currentUser(req)));
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await currentUser(req);
  const body = req.body || {};
  await user.update({
    nombres: optionalString(body.nombres ?? body.nombre)?.split(" ")[0] || user.nombres,
    apellidos: optionalString(body.apellidos) || user.apellidos,
    celular: optionalString(body.celular ?? body.phone) || user.celular,
    barberia: optionalString(body.barberia) ?? user.barberia,
    ciudad: optionalString(body.ciudad) ?? user.ciudad,
    direccion: optionalString(body.direccion) ?? user.direccion,
  });
  res.json(toProfile(user));
}

export async function updatePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await currentUser(req);
  const current = requiredString(req.body?.currentPassword, "currentPassword", 1);
  const next = requiredString(req.body?.newPassword, "newPassword", 8);
  if (!user.passwordHash || !verifyPassword(current, user.passwordHash)) {
    throw new HttpError(401, "Contrasena actual incorrecta");
  }
  await user.update({ passwordHash: hashPassword(next) });
  res.status(204).send();
}
