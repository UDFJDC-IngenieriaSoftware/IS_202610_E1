import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

/**
 * Manejador central de errores.
 * Debe registrarse ÚLTIMO en Express (4 parámetros).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Datos inválidos',
      detalles: err.issues.map((e) => ({
        campo: e.path.join('.'),
        mensaje: e.message,
      })),
    })
    return
  }

  if (err instanceof Error) {
    console.error('[Error]', err.message)
    res.status(500).json({ error: err.message })
    return
  }

  console.error('[Error desconocido]', err)
  res.status(500).json({ error: 'Error interno del servidor' })
}
