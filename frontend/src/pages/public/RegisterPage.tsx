/**
 * RegisterPage — /registro
 * Formulario de 3 pasos (stepper) implementado con useState.
 * Paso 1: datos de cuenta · Paso 2: datos de barbería · Paso 3: elección de plan.
 * HTML5 semántico: <main>, <aside>, <form>, <fieldset>, <legend>, <label>.
 */
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

/* ── Tipos internos ────────────────────────────────────────────────────── */
type PlanId = 'solo' | 'pro' | 'estudio'

interface StepOneDatos {
  nombre:    string
  apellido:  string
  email:     string
  whatsapp:  string
  password:  string
}

interface StepTwoDatos {
  nombreBarberia: string
  ciudad:         string
  sillas:         string
  direccion:      string
  citasSemana:    string
}

/* ── Iconos inline ─────────────────────────────────────────────────────── */
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
function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

/* ── Componente Stepper ────────────────────────────────────────────────── */
const PASOS: { num: number; label: string }[] = [
  { num: 1, label: 'Tu cuenta'   },
  { num: 2, label: 'Tu barbería' },
  { num: 3, label: 'Plan'        },
]

function Stepper({ paso }: { paso: number }) {
  return (
    <nav className="steps" aria-label="Pasos del registro">
      {PASOS.map((p, idx) => {
        const estado =
          p.num === paso ? 'is-on' :
          p.num  < paso  ? 'is-done' : ''
        return (
          <div key={p.num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={`step ${estado}`} aria-current={p.num === paso ? 'step' : undefined}>
              <div className="step-num">
                {p.num < paso ? <CheckIcon /> : p.num}
              </div>
              <span className="step-label">{p.label}</span>
            </div>
            {idx < PASOS.length - 1 && (
              <span className="step-arrow" aria-hidden="true"><ChevronIcon /></span>
            )}
          </div>
        )
      })}
    </nav>
  )
}

/* ── Componente principal ─────────────────────────────────────────────── */
export function RegisterPage() {
  const navigate = useNavigate()

  const [paso,       setPaso]       = useState<1 | 2 | 3>(1)
  const [planActivo, setPlanActivo] = useState<PlanId>('pro')
  const [submitting, setSubmitting] = useState(false)

  const [step1, setStep1] = useState<StepOneDatos>({
    nombre: '', apellido: '', email: '', whatsapp: '', password: '',
  })
  const [step2, setStep2] = useState<StepTwoDatos>({
    nombreBarberia: '', ciudad: 'Medellín', sillas: 'Solo yo (1 silla)',
    direccion: '', citasSemana: 'Menos de 20',
  })

  /* helpers */
  function s1(field: keyof StepOneDatos) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setStep1((p) => ({ ...p, [field]: e.target.value }))
  }
  function s2<K extends keyof StepTwoDatos>(field: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setStep2((p) => ({ ...p, [field]: e.target.value }))
  }

  function handleStep1(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPaso(2)
    window.scrollTo(0, 0)
  }
  function handleStep2(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPaso(3)
    window.scrollTo(0, 0)
  }
  async function handleStep3(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    try {
      // En modo mock: simula registro exitoso y redirige al panel
      await new Promise<void>((r) => setTimeout(r, 600))
      navigate('/panel/dashboard', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Contenido del aside según paso ─────────────────────────────── */
  const asideContent = paso === 1
    ? (
      <>
        <h2 className="auth-aside-title">
          14 días para probarlo, <em>sin tarjeta</em>.
        </h2>
        <p className="auth-aside-sub">
          En 10 minutos tienes tu bot atendiendo en WhatsApp y cobrando
          anticipos. Si no te sirve, cancelas. Así de simple.
        </p>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12, listStyle: 'none', padding: 0 }}>
          {[
            'Configuración en menos de 10 minutos',
            'Cobra anticipos por PSE desde el día 1',
            'Cancelas cuando quieras, sin permanencia',
          ].map((text) => (
            <li key={text} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'oklch(0.25 0.008 60)',
                display: 'grid', placeItems: 'center',
                color: 'oklch(0.78 0.13 55)', flexShrink: 0,
              }}>
                <CheckIcon />
              </div>
              <span style={{ fontSize: 14 }}>{text}</span>
            </li>
          ))}
        </ul>
      </>
    )
    : paso === 2
    ? (
      <>
        <h2 className="auth-aside-title">
          El bot habla <em>como tu negocio</em>.
        </h2>
        <p className="auth-aside-sub">
          Con el nombre y los servicios de tu barbería el bot saluda con tu
          marca, no con una respuesta genérica.
        </p>
      </>
    )
    : (
      <>
        <h2 className="auth-aside-title">
          Empieza gratis, <em>escala cuando quieras</em>.
        </h2>
        <p className="auth-aside-sub">
          No te cobramos hasta el día 15. Puedes cambiar de plan en cualquier
          momento desde tu panel.
        </p>
      </>
    )

  return (
    <div className="auth-shell">
      {/* ── Panel izquierdo ──────────────────────────────────────────── */}
      <aside className="auth-aside" aria-label="Beneficios de MiTurno">
        <Link className="pub-brand auth-aside-brand" to="/" style={{ color: 'white' }}>
          <div className="brand-mark"><ScissorsIcon /></div>
          <div>
            <div className="pub-brand-name" style={{ color: 'white' }}>MiTurno</div>
            <span className="pub-brand-sub">Agenda en WhatsApp</span>
          </div>
        </Link>

        <div className="auth-aside-content">{asideContent}</div>

        <blockquote className="auth-aside-quote">
          <strong>"Lo activé un domingo en la noche, el lunes ya tenía 4 citas pagadas."</strong>
          <br />Juan Camilo · Bogotá
        </blockquote>
      </aside>

      {/* ── Panel derecho (formulario multi-paso) ─────────────────── */}
      <main className="auth-main">
        <p className="auth-main-top">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>

        <div className="auth-form-wrap" style={{ maxWidth: 480 }}>
          <Stepper paso={paso} />

          {/* ── Paso 1: Cuenta ─────────────────────────────────────── */}
          {paso === 1 && (
            <section aria-labelledby="step1-title">
              <h1 id="step1-title" className="auth-form-title">Crea tu cuenta.</h1>
              <p className="auth-form-sub">Empezamos por lo más básico. Toma 1 minuto.</p>

              <form className="auth-form" onSubmit={handleStep1} noValidate>
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <legend className="sr-only">Datos personales</legend>
                  <div className="field-row">
                    <label className="field">
                      <span>Nombre</span>
                      <input
                        type="text" placeholder="Andrés"
                        value={step1.nombre} onChange={s1('nombre')}
                        autoComplete="given-name" required
                      />
                    </label>
                    <label className="field">
                      <span>Apellido</span>
                      <input
                        type="text" placeholder="Mejía"
                        value={step1.apellido} onChange={s1('apellido')}
                        autoComplete="family-name" required
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span>Correo electrónico</span>
                    <input
                      type="email" placeholder="andres@estudiobarberia.co"
                      value={step1.email} onChange={s1('email')}
                      autoComplete="email" required
                    />
                  </label>
                  <label className="field">
                    <span>WhatsApp del negocio</span>
                    <input
                      type="tel" placeholder="+57 312 445 7821"
                      value={step1.whatsapp} onChange={s1('whatsapp')}
                      autoComplete="tel"
                    />
                    <small style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                      Este será el número al que escriben tus clientes.
                    </small>
                  </label>
                  <label className="field">
                    <span>Contraseña</span>
                    <input
                      type="password" placeholder="Mínimo 8 caracteres"
                      value={step1.password} onChange={s1('password')}
                      autoComplete="new-password" minLength={8} required
                    />
                  </label>
                </fieldset>

                <button className="btn primary lg auth-form-cta" type="submit">
                  Continuar <ArrowIcon />
                </button>
              </form>
            </section>
          )}

          {/* ── Paso 2: Barbería ───────────────────────────────────── */}
          {paso === 2 && (
            <section aria-labelledby="step2-title">
              <h1 id="step2-title" className="auth-form-title">Cuéntanos de tu barbería.</h1>
              <p className="auth-form-sub">
                Esto sale en el bot cuando un cliente nuevo escribe.
              </p>

              <form className="auth-form" onSubmit={handleStep2} noValidate>
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <legend className="sr-only">Datos de la barbería</legend>
                  <label className="field">
                    <span>Nombre de tu barbería</span>
                    <input
                      type="text" placeholder="Estudio Barbería Andrés"
                      value={step2.nombreBarberia} onChange={s2('nombreBarberia')}
                      required
                    />
                  </label>
                  <div className="field-row">
                    <label className="field">
                      <span>Ciudad</span>
                      <select value={step2.ciudad} onChange={s2('ciudad')}>
                        {['Medellín','Bogotá','Cali','Barranquilla','Bucaramanga','Cartagena','Otra'].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Sillas</span>
                      <select value={step2.sillas} onChange={s2('sillas')}>
                        {['Solo yo (1 silla)','2 sillas','3 sillas','4+ sillas'].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="field">
                    <span>Dirección <small style={{ fontWeight: 400, color: 'var(--muted)' }}>(opcional)</small></span>
                    <input
                      type="text" placeholder="Cra. 43A #12-30, El Poblado"
                      value={step2.direccion} onChange={s2('direccion')}
                      autoComplete="street-address"
                    />
                  </label>
                  <label className="field">
                    <span>Citas que manejas por semana (aprox.)</span>
                    <select value={step2.citasSemana} onChange={s2('citasSemana')}>
                      {['Menos de 20','20–40','40–80','Más de 80'].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                </fieldset>

                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button
                    className="btn ghost lg"
                    type="button"
                    style={{ flexShrink: 0 }}
                    onClick={() => { setPaso(1); window.scrollTo(0, 0) }}
                  >
                    Atrás
                  </button>
                  <button className="btn primary lg auth-form-cta" type="submit" style={{ marginTop: 0 }}>
                    Continuar <ArrowIcon />
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ── Paso 3: Plan ───────────────────────────────────────── */}
          {paso === 3 && (
            <section aria-labelledby="step3-title">
              <h1 id="step3-title" className="auth-form-title">Elige tu plan.</h1>
              <p className="auth-form-sub">
                Empiezas con 14 días gratis. No te cobramos hasta el día 15.
              </p>

              <form className="auth-form" onSubmit={handleStep3} noValidate>
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <legend className="sr-only">Selección de plan</legend>
                  <div className="plan-pick" role="radiogroup" aria-label="Planes disponibles">
                    {([
                      { id: 'solo'    as PlanId, name: 'Solo',    price: '$29k', desc: 'Hasta 100 citas/mes · Bot + panel' },
                      { id: 'pro'     as PlanId, name: 'Pro',     price: '$59k', desc: 'Citas ilimitadas · Recordatorios · Reportes', badge: 'Recomendado' },
                      { id: 'estudio' as PlanId, name: 'Estudio', price: '$99k', desc: 'Hasta 4 barberos · Agendas independientes' },
                    ] as const).map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        role="radio"
                        aria-checked={planActivo === plan.id}
                        className={`plan-pick-item${planActivo === plan.id ? ' is-on' : ''}`}
                        onClick={() => setPlanActivo(plan.id)}
                      >
                        <div className="plan-pick-radio" />
                        <div style={{ flex: 1 }}>
                          <div className="plan-pick-name">
                            {plan.name}
                            {'badge' in plan && (
                              <span className="pill" style={{
                                marginLeft: 6,
                                background: 'var(--accent-soft)',
                                color: 'var(--accent)',
                                borderColor: 'var(--accent-bd)',
                                fontSize: 10,
                              }}>
                                {plan.badge}
                              </span>
                            )}
                          </div>
                          <div className="plan-pick-desc">{plan.desc}</div>
                        </div>
                        <div className="plan-pick-price">
                          {plan.price}<small> /mes</small>
                        </div>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="alert" style={{ marginTop: 18 }} role="note">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  <div>Te avisaremos por correo 3 días antes de que termine la prueba.</div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  <button
                    className="btn ghost lg"
                    type="button"
                    style={{ flexShrink: 0 }}
                    onClick={() => { setPaso(2); window.scrollTo(0, 0) }}
                  >
                    Atrás
                  </button>
                  <button
                    className="btn primary lg auth-form-cta"
                    type="submit"
                    style={{ marginTop: 0 }}
                    disabled={submitting}
                    aria-busy={submitting}
                  >
                    {submitting ? 'Creando cuenta…' : 'Crear cuenta y entrar'}
                    {!submitting && <ArrowIcon />}
                  </button>
                </div>

                <p className="auth-foot">
                  Al crear la cuenta aceptas nuestros{' '}
                  <a href="#">Términos</a> y <a href="#">Política de privacidad</a>.
                </p>
              </form>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
