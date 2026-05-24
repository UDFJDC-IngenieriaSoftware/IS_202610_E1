import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

/**
 * Middleware de validación con Zod.
 * Valida req.body contra el schema dado.
 * Si falla, pasa el ZodError al errorHandler.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      next(result.error)
      return
    }
    req.body = result.data
    next()
  }
}
