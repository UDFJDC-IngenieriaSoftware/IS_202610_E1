/**
 * Configuración de Sentry para error tracking en frontend
 *
 * Inicializar en main.tsx:
 * ```typescript
 * import { initSentry } from './config/sentry'
 * initSentry()
 * ```
 */

import * as Sentry from '@sentry/react'

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  const isDev = import.meta.env.DEV

  if (!dsn && !isDev) {
    console.warn('VITE_SENTRY_DSN not configured')
    return
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    enabled: !isDev, // Disable in development
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
      new Sentry.BrowserTracing({
        // Set sampling rate for performance monitoring
        tracingOrigins: [/^\//],
      }),
    ],

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Network errors (user's network issues)
      'NetworkError',
      'Network request failed',
    ],

    beforeSend(event) {
      // Filter out certain events
      if (event.exception) {
        const error = event.exception.values?.[0]?.value
        // Don't send certain errors
        if (error?.includes('Network')) {
          return null
        }
      }
      return event
    },
  })
}

/**
 * Utilidades para usar Sentry en componentes
 */

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  })
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level)
}

export function setUser(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  })
}

export function clearUser() {
  Sentry.setUser(null)
}

/**
 * Hook para capturar errores en componentes
 */
export function useSentryErrorHandler() {
  return {
    captureException,
    captureMessage,
  }
}
