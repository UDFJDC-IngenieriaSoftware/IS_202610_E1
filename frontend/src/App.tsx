/* eslint-disable react-refresh/only-export-components */
/**
 * App.tsx — árbol de rutas de MiTurno.
 *
 * Jerarquía:
 *   /                 → PublicLayout  → LandingPage
 *   /login            → AuthLayout    → LoginPage
 *   /registro         → AuthLayout    → RegisterPage
 *   /panel/*          → BarberPanelLayout (requiere rol=barbero)
 *   /admin/*          → AdminPanelLayout  (requiere rol=admin)
 *
 * Performance: todas las páginas se cargan bajo demanda (lazy + Suspense).
 * Los layouts son eager porque se necesitan en el primer render.
 * El Suspense global vive en main.tsx envolviendo <RouterProvider>.
 */
import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

// Layouts — eager (pequeños, necesarios en el primer frame)
import { PublicLayout }      from './components/layouts/PublicLayout'
import { AuthLayout }        from './components/layouts/AuthLayout'
import { BarberPanelLayout } from './components/layouts/BarberPanelLayout'
import { AdminPanelLayout }  from './components/layouts/AdminPanelLayout'

// Páginas públicas — lazy
const LandingPage  = lazy(() => import('./pages/public/LandingPage').then(m => ({ default: m.LandingPage })))
const LoginPage    = lazy(() => import('./pages/public/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/public/RegisterPage').then(m => ({ default: m.RegisterPage })))

// Páginas del panel del barbero — lazy
const DashboardPage = lazy(() => import('./pages/barber/DashboardPage').then(m => ({ default: m.DashboardPage })))
const AgendaPage    = lazy(() => import('./pages/barber/AgendaPage').then(m => ({ default: m.AgendaPage })))
const ServiciosPage = lazy(() => import('./pages/barber/ServiciosPage').then(m => ({ default: m.ServiciosPage })))
const HorarioPage   = lazy(() => import('./pages/barber/HorarioPage').then(m => ({ default: m.HorarioPage })))
const HistorialPage  = lazy(() => import('./pages/barber/HistorialPage').then(m => ({ default: m.HistorialPage })))
const ClientesPage   = lazy(() => import('./pages/barber/ClientesPage').then(m => ({ default: m.ClientesPage })))

// Páginas del admin de plataforma — lazy
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })))
const BarberosPage       = lazy(() => import('./pages/admin/BarberosPage').then(m => ({ default: m.BarberosPage })))
const SuscripcionesPage  = lazy(() => import('./pages/admin/SuscripcionesPage').then(m => ({ default: m.SuscripcionesPage })))
const PlanesPage         = lazy(() => import('./pages/admin/PlanesPage').then(m => ({ default: m.PlanesPage })))
const PagosPage          = lazy(() => import('./pages/admin/PagosPage').then(m => ({ default: m.PagosPage })))
const SoportePage        = lazy(() => import('./pages/admin/SoportePage').then(m => ({ default: m.SoportePage })))

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
      { path: 'clientes',  element: <ClientesPage />  },
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
