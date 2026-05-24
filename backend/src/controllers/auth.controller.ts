import { Request, Response, NextFunction } from 'express'
import { loginByEmail, encodeSession } from '../services/auth.service'
import { ENV } from '../config/env'
import Barbero from '../models/Barbero'

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: ENV.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body as { email?: string }
    if (!email) {
      res.status(400).json({ error: 'email requerido' })
      return
    }

    const { user, perfil, rol } = await loginByEmail(email)
    const cookieValue = encodeSession(user)
    res.cookie(ENV.COOKIE_NAME, cookieValue, COOKIE_OPTS)
    res.json({ perfil, rol })
  } catch (err: any) {
    if (err?.status) {
      res.status(err.status).json({ error: err.message })
      return
    }
    next(err)
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie(ENV.COOKIE_NAME)
  res.json({ ok: true })
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = req.user
  if (!user) {
    res.status(401).json({ error: 'No autenticado' })
    return
  }

  if (user.rol === 'admin') {
    res.json({
      id: user.id,
      nombre: 'Administrador',
      barberia: 'MiTurno Platform',
      ciudad: '—',
      inicial: 'AD',
    })
    return
  }

  const barbero = await Barbero.findByPk(user.idBarbero!)
  if (!barbero) {
    res.status(404).json({ error: 'Barbero no encontrado' })
    return
  }

  const nombreCompleto = `${barbero.nombres} ${barbero.apellidos}`
  const inicial = (barbero.nombres[0] + (barbero.apellidos[0] ?? '')).toUpperCase()
  res.json({
    id: barbero.id,
    nombre: nombreCompleto,
    barberia: barbero.barberia ?? nombreCompleto,
    ciudad: barbero.ciudad ?? '—',
    inicial,
  })
}
