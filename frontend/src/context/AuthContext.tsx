/**
 * AuthContext — estado global de autenticación.
 * Persiste el token en localStorage y expone el perfil + rol activo.
 *
 * Solo exporta el componente AuthProvider para cumplir
 * react-refresh/only-export-components.
 * El hook useAuth y el objeto AuthContext viven en src/hooks/useAuth.ts.
 */
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { AuthContext, type AuthState, type Rol } from '../hooks/useAuth'
import { login as loginService, logout as logoutService, getMe } from '../services/auth.service'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    perfil:  null,
    rol:     null,
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

  const login = useCallback(async (payload: Parameters<typeof loginService>[0]) => {
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
