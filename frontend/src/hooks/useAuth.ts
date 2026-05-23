/**
 * useAuth + AuthContext — separados del componente AuthProvider para cumplir
 * react-refresh/only-export-components: el .tsx sólo exporta componentes.
 */
import { createContext, useContext } from 'react'
import type { BarberoPerfil } from '../types'
import type { LoginPayload } from '../services/auth.service'

export type Rol = 'barbero' | 'admin'

export interface AuthState {
  perfil: BarberoPerfil | null
  rol: Rol | null
  loading: boolean
}

export interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
}

/** Objeto de contexto — importado por AuthProvider y por useAuth. */
export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
