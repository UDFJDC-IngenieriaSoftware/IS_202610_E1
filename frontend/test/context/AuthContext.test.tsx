/**
 * Tests de src/context/AuthContext.tsx
 * Mockea los services de auth para aislar la lógica del contexto.
 *
 * Nota sobre vi.mock: la llamada es hoisted al tope del fichero por Vitest,
 * por eso los valores definidos fuera del factory no son accesibles. Se usa
 * vi.hoisted() para declarar referencias que sí estarán disponibles.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

// ── Mock de auth.service ──────────────────────────────────────────────────────
// vi.hoisted() garantiza que las referencias estén disponibles dentro de
// vi.mock(), que es hoisted al tope del fichero por Vitest antes que
// cualquier const/let del módulo.
const { mockLogin, mockLogout, mockGetMe } = vi.hoisted(() => ({
  mockLogin:  vi.fn(),
  mockLogout: vi.fn(),
  mockGetMe:  vi.fn(),
}))

vi.mock('../../src/services/auth.service', () => ({
  login:  mockLogin,
  logout: mockLogout,
  getMe:  mockGetMe,
}))

// Ahora sí se pueden importar los módulos que usan el service mockeado
import { AuthProvider } from '../../src/context/AuthContext'
import { useAuth } from '../../src/hooks/useAuth'

// ── Datos de prueba ───────────────────────────────────────────────────────────

const mockPerfil = {
  id: 'b001',
  nombre: 'Andrés Test',
  barberia: 'Barbería Test',
  ciudad: 'Bogotá',
  inicial: 'AT',
}

// ── Componente consumidor de prueba ───────────────────────────────────────────

function AuthConsumer() {
  const { perfil, rol, loading, login, logout } = useAuth()
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="perfil">{perfil?.nombre ?? 'sin-perfil'}</div>
      <div data-testid="rol">{rol ?? 'sin-rol'}</div>
      <button onClick={() => void login({ email: 'test@test.com', password: '123' })}>
        Entrar
      </button>
      <button onClick={() => void logout()}>Salir</button>
    </div>
  )
}

function Wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthContext', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    // Por defecto: sin sesión activa
    mockGetMe.mockResolvedValue(null)
    mockLogout.mockResolvedValue(undefined)
    mockLogin.mockResolvedValue({ perfil: mockPerfil, rol: 'barbero' })
  })

  it('inicia con loading=true y sin perfil', () => {
    // getMe que nunca resuelve → loading queda en true
    mockGetMe.mockReturnValue(new Promise(() => {}))

    render(<AuthConsumer />, { wrapper: Wrapper })

    expect(screen.getByTestId('loading').textContent).toBe('true')
    expect(screen.getByTestId('perfil').textContent).toBe('sin-perfil')
  })

  it('resuelve loading=false tras llamar getMe()', async () => {
    render(<AuthConsumer />, { wrapper: Wrapper })

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false'),
    )
  })

  it('sin sesión previa, perfil y rol son null', async () => {
    render(<AuthConsumer />, { wrapper: Wrapper })

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false'),
    )

    expect(screen.getByTestId('perfil').textContent).toBe('sin-perfil')
    expect(screen.getByTestId('rol').textContent).toBe('sin-rol')
  })

  it('login establece perfil y rol en el estado', async () => {
    render(<AuthConsumer />, { wrapper: Wrapper })

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false'),
    )

    await user.click(screen.getByText('Entrar'))

    await waitFor(() => {
      expect(screen.getByTestId('perfil').textContent).toBe('Andrés Test')
      expect(screen.getByTestId('rol').textContent).toBe('barbero')
    })
  })

  it('login guarda el rol en localStorage', async () => {
    render(<AuthConsumer />, { wrapper: Wrapper })

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false'),
    )

    await user.click(screen.getByText('Entrar'))

    await waitFor(() => {
      expect(localStorage.getItem('miturno_rol')).toBe('barbero')
    })
  })

  it('login NO guarda el token en localStorage (seguridad)', async () => {
    render(<AuthConsumer />, { wrapper: Wrapper })

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false'),
    )

    await user.click(screen.getByText('Entrar'))

    await waitFor(() =>
      expect(screen.getByTestId('perfil').textContent).toBe('Andrés Test'),
    )

    expect(localStorage.getItem('miturno_token')).toBeNull()
  })

  it('logout limpia perfil, rol y localStorage', async () => {
    render(<AuthConsumer />, { wrapper: Wrapper })

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false'),
    )

    // Login primero
    await user.click(screen.getByText('Entrar'))
    await waitFor(() =>
      expect(screen.getByTestId('perfil').textContent).toBe('Andrés Test'),
    )

    // Logout
    await user.click(screen.getByText('Salir'))

    await waitFor(() => {
      expect(screen.getByTestId('perfil').textContent).toBe('sin-perfil')
      expect(screen.getByTestId('rol').textContent).toBe('sin-rol')
      expect(localStorage.getItem('miturno_rol')).toBeNull()
    })
  })

  it('restaura sesión si getMe() devuelve un perfil', async () => {
    mockGetMe.mockResolvedValue(mockPerfil)
    localStorage.setItem('miturno_rol', 'barbero')

    render(<AuthConsumer />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('perfil').textContent).toBe('Andrés Test')
      expect(screen.getByTestId('rol').textContent).toBe('barbero')
    })
  })

  it('getMe() es llamado al montar para restaurar sesión', async () => {
    render(<AuthConsumer />, { wrapper: Wrapper })

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false'),
    )

    expect(mockGetMe).toHaveBeenCalledOnce()
  })
})
