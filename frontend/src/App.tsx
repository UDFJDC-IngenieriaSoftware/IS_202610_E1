/**
 * App.tsx — árbol de rutas de MiTurno.
 *
 * Jerarquía:
 *   /                 → PublicLayout  → LandingPage
 *   /login            → AuthLayout    → LoginPage
 *   /registro         → AuthLayout    → RegisterPage
 *   /panel/*          → BarberPanelLayout (requiere rol=barbero)
 *   /admin/*          → AdminPanelLayout  (requiere rol=admin)
 */
import { createBrowserRouter, Navigate } from 'react-router-dom'

// Layouts
import { PublicLayout }      from './components/layouts/PublicLayout'
import { AuthLayout }        from './components/layouts/AuthLayout'
import { BarberPanelLayout } from './components/layouts/BarberPanelLayout'
import { AdminPanelLayout }  from './components/layouts/AdminPanelLayout'

// Páginas públicas
import { LandingPage }   from './pages/public/LandingPage'
import { LoginPage }     from './pages/public/LoginPage'
import { RegisterPage }  from './pages/public/RegisterPage'

// Páginas del panel del barbero
import { DashboardPage }  from './pages/barber/DashboardPage'
import { AgendaPage }     from './pages/barber/AgendaPage'
import { ServiciosPage }  from './pages/barber/ServiciosPage'
import { HorarioPage }    from './pages/barber/HorarioPage'
import { HistorialPage }  from './pages/barber/HistorialPage'

// Páginas del admin de plataforma
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { BarberosPage }       from './pages/admin/BarberosPage'
import { SuscripcionesPage }  from './pages/admin/SuscripcionesPage'
import { PlanesPage }         from './pages/admin/PlanesPage'
import { PagosPage }          from './pages/admin/PagosPage'
import { SoportePage }        from './pages/admin/SoportePage'

export const router = createBrowserRouter([
  // ── Área pública ────────────────────────────────────────────────────────────
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
    ],
  },

  // ── Auth (login / registro) ──────────────────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: '/login',    element: <LoginPage />    },
      { path: '/registro', element: <RegisterPage /> },
    ],
  },

  // ── Panel del barbero ────────────────────────────────────────────────────────
  {
    path: '/panel',
    element: <BarberPanelLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'agenda',    element: <AgendaPage />    },
      { path: 'servicios', element: <ServiciosPage /> },
      { path: 'horario',   element: <HorarioPage />   },
      { path: 'historial', element: <HistorialPage /> },
    ],
  },

  // ── Admin de plataforma ──────────────────────────────────────────────────────
  {
    path: '/admin',
    element: <AdminPanelLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard',     element: <AdminDashboardPage /> },
      { path: 'barberos',      element: <BarberosPage />       },
      { path: 'suscripciones', element: <SuscripcionesPage />  },
      { path: 'planes',        element: <PlanesPage />         },
      { path: 'pagos',         element: <PagosPage />          },
      { path: 'soporte',       element: <SoportePage />        },
    ],
  },

  // ── Fallback ─────────────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
])
