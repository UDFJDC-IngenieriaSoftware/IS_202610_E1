/**
 * auth.ts — middleware de autenticación STUB (sin JWT).
 *
 * La cookie miturno_user contiene un JSON base64 con { id, rol, idBarbero? }.
 * ⚠️  Esto es temporal e inseguro — solo para desarrollo.
 * Se reemplazará por JWT firmado + bcrypt cuando el resto esté estable.
 */

import { Request, Response, NextFunction } from 'express'
import { ENV } from '../config/env'

export interface AuthUser {
  id: string
  rol: 'admin' | 'barbero'
  idBarbero?: string | null
}

// Augmentar el tipo de Request de Express
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

/**
 * Lee la cookie plana y, si es válida, inyecta req.user.
 * No lanza error si no hay cookie — deja que authRequired lo haga.
 */
export function getCurrentUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const raw = req.cookies?.[ENV.COOKIE_NAME]
    if (raw) {
      const decoded = Buffer.from(raw, 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded) as AuthUser
      if (parsed?.id && parsed?.rol) {
        req.user = parsed
      }
    }
  } catch {
    // cookie inválida → req.user queda undefined
  }
  next()
}

/**
 * Exige que haya sesión activa (req.user presente).
 * Si no, responde 401.
 */
export function authRequired(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' })
    return
  }
  next()
}
