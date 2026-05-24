import { Request, Response, NextFunction } from 'express'
import type { AuthUser } from './auth'

/**
 * Exige que req.user tenga uno de los roles indicados.
 * Usa authRequired antes de este middleware.
 */
export function requireRole(...roles: AuthUser['rol'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' })
      return
    }
    if (!roles.includes(req.user.rol)) {
      res.status(403).json({ error: 'Acceso denegado' })
      return
    }
    next()
  }
}
