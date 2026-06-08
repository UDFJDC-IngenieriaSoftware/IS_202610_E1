/**
 * AuthContext — estado global de autenticación.
 *
 * Estrategia de sesión:
 * - El token JWT lo gestiona el backend como cookie HttpOnly; el front NUNCA
 *   lo lee ni lo almacena.
 * - Solo persiste el rol en localStorage (dato no sensible).
 * - Al montar, llama getMe() para restaurar sesión desde la cookie.
 * - Registra el interceptor 401 de apiClient para cerrar sesión automáticamente.
 *
 * Solo exporta el componente AuthProvider para cumplir
 * react-refresh/only-export-components.
 * El hook useAuth y el objeto AuthContext viven en src/hooks/useAuth.ts.
 */
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { AuthContext, type AuthState, type Rol } from '../hooks/useAuth'
import { login as loginService, logout as logoutService, getMe } from '../services/auth.service'
import { register401Handler } from '../services/apiClient'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    perfil:  null,
    rol:     null,
    loading: true,
  })

  const logout = useCallback(async () => {
    try { await logoutService() } catch { /* ignorar errores de red al cerrar */ }
    localStorage.removeItem('miturno_rol')
    setState({ perfil: null, rol: null, loading: false })
  }, [])

  // Registrar handler 401 para que apiClient llame logout al expirar la sesión
  useEffect(() => {
    register401Handler(() => { void logout() })
  }, [logout])

  // Restaurar sesión al montar (la cookie HttpOnly se envía automáticamente)
  useEffect(() => {
    getMe()
      .then((perfil) => {
        const rolGuardado = (localStorage.getItem('miturno_rol') as Rol) ?? 'barbero'
        setState({ perfil, rol: perfil ? rolGuardado : null, loading: false })
      })
      .catch(() => setState({ perfil: null, rol: null, loading: false }))
  }, [])

  const login = useCallback(async (payload: Parameters<typeof loginService>[0]) => {
    // El backend devuelve Set-Cookie HttpOnly; solo guardamos perfil y rol
    const { perfil, rol } = await loginService(payload)
    localStorage.setItem('miturno_rol', rol)
    setState({ perfil, rol, loading: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
