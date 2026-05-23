/**
 * AuthContext — estado global de autenticación.
 * Persiste el token en localStorage y expone el perfil + rol activo.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { BarberoPerfil } from '../types'
import { login as loginService, logout as logoutService, getMe } from '../services/auth.service'
import type { LoginPayload } from '../services/auth.service'

type Rol = 'barbero' | 'admin'

interface AuthState {
  perfil: BarberoPerfil | null
  rol: Rol | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    perfil: null,
    rol: null,
    loading: true,
  })

  // Restaurar sesión al montar
  useEffect(() => {
    getMe()
      .then((perfil) => {
        const rolGuardado = (localStorage.getItem('miturno_rol') as Rol) ?? 'barbero'
        setState({ perfil, rol: perfil ? rolGuardado : null, loading: false })
      })
      .catch(() => setState({ perfil: null, rol: null, loading: false }))
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const { token, perfil, rol } = await loginService(payload)
    localStorage.setItem('miturno_token', token)
    localStorage.setItem('miturno_rol', rol)
    setState({ perfil, rol, loading: false })
  }, [])

  const logout = useCallback(async () => {
    await logoutService()
    localStorage.removeItem('miturno_token')
    localStorage.removeItem('miturno_rol')
    setState({ perfil: null, rol: null, loading: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
