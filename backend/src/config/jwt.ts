import * as jwt from "jsonwebtoken";
import { env } from "./env";

export interface JwtPayload {
  userId: number;
  email: string;
  role: "customer" | "barber" | "admin";
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresSeconds,
    algorithm: "HS256",
  });
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      algorithms: ["HS256"],
    }) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw error;
  }
}

export function refreshToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return signToken(payload);
}
