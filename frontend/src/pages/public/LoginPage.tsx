/**
 * LoginPage — /login
 * HTML5 semántico: <main>, <aside>, <form>, <label> anidado.
 * Conectada a AuthContext.login(); redirige según rol tras autenticar.
 */
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ScissorsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

export function LoginPage() {
  const { login, rol } = useAuth()
  const navigate       = useNavigate()

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [remember,    setRemember]    = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)
    setSubmitting(true)
    try {
      await login({ email, password })
      // AuthLayout redirigirá automáticamente, pero por si acaso:
      navigate(rol === 'admin' ? '/admin/dashboard' : '/panel/dashboard', { replace: true })
    } catch {
      setErrorMsg('Correo o contraseña incorrectos. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      {/* ── Panel izquierdo (branding) ─────────────────────────────────── */}
      <aside className="auth-aside" aria-label="Información de MiTurno">
        <Link className="pub-brand auth-aside-brand" to="/" style={{ color: 'white' }}>
          <div className="brand-mark"><ScissorsIcon /></div>
          <div>
            <div className="pub-brand-name" style={{ color: 'white' }}>MiTurno</div>
            <span className="pub-brand-sub">Agenda en WhatsApp</span>
          </div>
        </Link>

        <div className="auth-aside-content">
          <h2 className="auth-aside-title">
            Tu agenda <em>te está esperando</em>.
          </h2>
          <p className="auth-aside-sub">
            Mientras dormías, el bot agendó 3 citas y cobró 67.500 pesos en
            anticipos. Solo tienes que abrir tu panel.
          </p>

          <div className="auth-stat-row">
            <div>
              <div className="auth-stat-big">+180</div>
              <div className="auth-stat-label">barberos activos</div>
            </div>
            <div>
              <div className="auth-stat-big">−66%</div>
              <div className="auth-stat-label">en no shows</div>
            </div>
            <div>
              <div className="auth-stat-big">24/7</div>
              <div className="auth-stat-label">bot atendiendo</div>
            </div>
          </div>
        </div>

        <blockquote className="auth-aside-quote">
          <strong>"Antes contestaba 80 mensajes al día. Ahora corto pelo."</strong>
          <br />Andrés M. · Medellín
        </blockquote>
      </aside>

      {/* ── Panel derecho (formulario) ────────────────────────────────── */}
      <main className="auth-main">
        <p className="auth-main-top">
          ¿No tienes cuenta? <Link to="/registro">Crea una</Link>
        </p>

        <div className="auth-form-wrap">
          <h1 className="auth-form-title">Bienvenido de vuelta.</h1>
          <p className="auth-form-sub">
            Entra a tu panel para ver la agenda del día.
          </p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {errorMsg && (
              <div className="alert" role="alert" aria-live="assertive">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <div>{errorMsg}</div>
              </div>
            )}

            <label className="field">
              <span>Correo electrónico</span>
              <input
                type="email"
                placeholder="andres@estudiobarberia.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label className="field">
              <span>Contraseña</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <div className="field-row-checkbox">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Recordarme en este dispositivo
              </label>
              <a className="link" href="#">¿Olvidaste tu contraseña?</a>
            </div>

            <button
              className="btn primary lg auth-form-cta"
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? 'Entrando…' : 'Entrar al panel'}
              {!submitting && <ArrowIcon />}
            </button>

            <div className="auth-divider">o continúa con</div>

            <div className="auth-social">
              <button className="btn ghost" type="button">
                {/* Google */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>
              <button className="btn ghost" type="button">
                {/* WhatsApp */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/>
                </svg>
                Continuar con WhatsApp
              </button>
            </div>

            <p className="auth-foot">
              Al continuar aceptas nuestros{' '}
              <a href="#">Términos</a> y <a href="#">Política de privacidad</a>.
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
