/**
 * auth.service.ts — servicio de autenticación STUB sin JWT.
 *
 * Login: busca Usuario por email (ignora password).
 * Codifica la sesión como JSON base64 en una cookie plana.
 *
 * TODO: reemplazar por bcrypt + JWT firmado cuando el resto esté estable.
 */

import Usuario from '../models/Usuario'
import Barbero from '../models/Barbero'
import type { AuthUser } from '../middleware/auth'
import type { BarberoPerfil } from '../types/api'

export interface LoginResult {
  user: AuthUser
  perfil: BarberoPerfil
  rol: 'barbero' | 'admin'
}

export async function loginByEmail(email: string): Promise<LoginResult> {
  const usuario = await Usuario.findOne({ where: { email } })
  if (!usuario) {
    throw Object.assign(new Error('Usuario no encontrado'), { status: 401 })
  }

  const user: AuthUser = {
    id: usuario.id,
    rol: usuario.rol,
    idBarbero: usuario.idBarbero,
  }

  let perfil: BarberoPerfil

  if (usuario.rol === 'admin') {
    perfil = {
      id: usuario.id,
      nombre: 'Administrador',
      barberia: 'MiTurno Platform',
      ciudad: '—',
      inicial: 'AD',
    }
  } else {
    const barbero = await Barbero.findByPk(usuario.idBarbero!)
    if (!barbero) {
      throw Object.assign(new Error('Barbero no encontrado'), { status: 500 })
    }
    const nombreCompleto = `${barbero.nombres} ${barbero.apellidos}`
    const inicial = (barbero.nombres[0] + (barbero.apellidos[0] ?? '')).toUpperCase()
    perfil = {
      id: barbero.id,
      nombre: nombreCompleto,
      barberia: barbero.barberia ?? nombreCompleto,
      ciudad: barbero.ciudad ?? '—',
      inicial,
    }
  }

  return { user, perfil, rol: usuario.rol }
}

/** Encode session payload to base64 cookie value */
export function encodeSession(user: AuthUser): string {
  return Buffer.from(JSON.stringify(user), 'utf-8').toString('base64')
}
