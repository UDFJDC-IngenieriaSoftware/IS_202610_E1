import {
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { env } from "../config/env";
import { Barbero, HorarioDia, sequelize } from "../models";
import { HttpError } from "../utils/http";

export interface AuthClaims {
  sub: string;
  email: string;
  rol: "barbero" | "admin";
  exp: number;
}

export interface RegisterInput {
  nombres: string;
  apellidos: string;
  email: string;
  celular: string;
  password: string;
  barberia?: string;
  ciudad?: string;
  direccion?: string;
  plan?: "solo" | "pro" | "estudio";
}

export const DEFAULT_SCHEDULE = [
  { idx: 0, activo: false, inicio: "10:00", fin: "14:00", descansoIni: "", descansoFin: "" },
  { idx: 1, activo: true, inicio: "09:00", fin: "19:00", descansoIni: "13:00", descansoFin: "14:00" },
  { idx: 2, activo: true, inicio: "09:00", fin: "19:00", descansoIni: "13:00", descansoFin: "14:00" },
  { idx: 3, activo: true, inicio: "09:00", fin: "19:00", descansoIni: "13:00", descansoFin: "14:00" },
  { idx: 4, activo: true, inicio: "09:00", fin: "20:00", descansoIni: "13:00", descansoFin: "14:00" },
  { idx: 5, activo: true, inicio: "09:00", fin: "20:00", descansoIni: "13:00", descansoFin: "14:00" },
  { idx: 6, activo: true, inicio: "08:00", fin: "18:00", descansoIni: "12:30", descansoFin: "13:30" },
] as const;

function base64Url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 120_000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;
  const actual = pbkdf2Sync(password, salt, 120_000, 32, "sha256");
  const expected = Buffer.from(storedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function signToken(user: Barbero): string {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const claims: AuthClaims = {
    sub: user.id,
    email: user.email || "",
    rol: user.rol,
    exp: Math.floor(Date.now() / 1000) + env.jwtExpiresSeconds,
  };
  const payload = base64Url(JSON.stringify(claims));
  const signature = createHmac("sha256", env.jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): AuthClaims {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) {
    throw new HttpError(401, "Sesion invalida");
  }
  const expected = createHmac("sha256", env.jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new HttpError(401, "Sesion invalida");
  }
  let claims: AuthClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthClaims;
  } catch {
    throw new HttpError(401, "Sesion invalida");
  }
  if (!claims.sub || !claims.exp || claims.exp <= Math.floor(Date.now() / 1000)) {
    throw new HttpError(401, "Sesion expirada");
  }
  return claims;
}

export function toProfile(user: Barbero) {
  const nombre = `${user.nombres} ${user.apellidos}`.trim();
  return {
    id: user.id,
    nombre,
    barberia: user.barberia || nombre,
    ciudad: user.ciudad || "",
    inicial: `${user.nombres.charAt(0)}${user.apellidos.charAt(0)}`.toUpperCase(),
  };
}

export class AuthService {
  async register(input: RegisterInput): Promise<Barbero> {
    const existing = await Barbero.findOne({ where: { email: input.email.toLowerCase() } });
    if (existing) throw new HttpError(409, "El correo ya esta registrado");

    if (input.password.length < 8) {
      throw new HttpError(400, "La contrasena debe tener minimo 8 caracteres");
    }

    return sequelize.transaction(async (transaction) => {
      const user = await Barbero.create(
        {
          nombres: input.nombres,
          apellidos: input.apellidos,
          email: input.email.toLowerCase(),
          celular: input.celular,
          passwordHash: hashPassword(input.password),
          barberia: input.barberia,
          ciudad: input.ciudad,
          direccion: input.direccion,
          plan: input.plan || "solo",
        },
        { transaction },
      );

      await HorarioDia.bulkCreate(
        DEFAULT_SCHEDULE.map((schedule) => ({ ...schedule, idBarbero: user.id })),
        { transaction },
      );
      return user;
    });
  }

  async login(email: string, password: string): Promise<Barbero> {
    const user = await Barbero.findOne({ where: { email: email.toLowerCase(), activo: true } });
    if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
      throw new HttpError(401, "Credenciales incorrectas");
    }
    return user;
  }
}
