import { Link } from 'react-router-dom'

function ScissorsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
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
function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

export function LandingPage() {
  return (
    <>
      {/* NAV */}
      <header className="pub-nav">
        <Link to="/" className="pub-brand">
          <div className="brand-mark"><ScissorsIcon /></div>
          <div>
            <div className="pub-brand-name">MiTurno</div>
            <span className="pub-brand-sub">Agenda en WhatsApp</span>
          </div>
        </Link>
        <nav className="pub-nav-links" aria-label="Navegación principal">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#features">Para barberos</a>
          <a href="#planes">Planes</a>
          <a href="#testimonios">Historias</a>
        </nav>
        <div className="pub-nav-cta">
          <Link className="link" to="/login">Iniciar sesión</Link>
          <Link className="btn primary" to="/registro">Empezar gratis</Link>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="hero" aria-labelledby="hero-title">
          <div>
            <div className="hero-eyebrow">
              <span className="eb-tag">Beta</span>
              Hecho en Colombia · Listo para PSE
            </div>
            <h1 id="hero-title" className="hero-title">
              Tu agenda <em>en el WhatsApp</em> que tus clientes ya usan.
            </h1>
            <p className="hero-sub">
              Deja de contestar "¿tienes campo a las 5?" todo el día. Un bot atiende,
              agenda y cobra el anticipo del 50% por PSE. Tú solo cortas.
            </p>
            <div className="hero-cta">
              <Link className="btn primary lg" to="/registro">
                Empezar gratis · 14 días <ArrowIcon />
              </Link>
              <Link className="btn ghost lg" to="/panel/dashboard">Ver demo del panel</Link>
            </div>
            <div className="hero-trust">
              <div><strong>+180</strong> barberos activos</div>
              <span className="sep" aria-hidden="true" />
              <div>Sin tarjeta · cancela cuando quieras</div>
              <span className="sep" aria-hidden="true" />
              <div>Soporte en español</div>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hv-card">
              <div className="hv-card-head">
                <div>
                  <div className="hv-card-title">Viernes 8 de mayo</div>
                  <div className="hv-card-sub">Tu agenda · 11 citas hoy</div>
                </div>
                <span className="pill" style={{ background: 'var(--st-green-bg)', color: 'var(--st-green-fg)', borderColor: 'var(--st-green-bd)' }}>
                  <span className="pill-dot" style={{ background: 'var(--st-green-fg)' }} />En curso
                </span>
              </div>
              <div className="hv-card-stats">
                <div className="hv-stat"><div className="hv-stat-label">Citas hoy</div><div className="hv-stat-big">11</div></div>
                <div className="hv-stat"><div className="hv-stat-label">Ingresos</div><div className="hv-stat-big">$386k</div></div>
                <div className="hv-stat"><div className="hv-stat-label">Ocupación</div><div className="hv-stat-big">79%</div></div>
              </div>
              <div className="hv-events">
                {[
                  { hora: '14:00', nombre: 'Felipe Arango',   svc: 'Corte + barba · $45.000', estado: 'Confirmada', clr: 'green' },
                  { hora: '15:00', nombre: 'Cristian Patiño', svc: 'Corte clásico · $28.000', estado: 'Pendiente',  clr: 'amber' },
                  { hora: '15:30', nombre: 'Tomás Velásquez', svc: 'Corte fade · $35.000',    estado: 'Confirmada', clr: 'green' },
                ].map((ev) => (
                  <div className="hv-event" key={ev.hora}>
                    <div className="hv-event-time">{ev.hora}</div>
                    <div className="hv-event-bar" style={{ background: `var(--st-${ev.clr}-fg)` }} />
                    <div><div className="hv-event-name">{ev.nombre}</div><div className="hv-event-svc">{ev.svc}</div></div>
                    <span className="pill" style={{ background: `var(--st-${ev.clr}-bg)`, color: `var(--st-${ev.clr}-fg)`, borderColor: `var(--st-${ev.clr}-bd)` }}>{ev.estado}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hv-chat">
              <div className="hv-chat-head">
                <div className="hv-chat-avatar">AM</div>
                <div><div className="hv-chat-name">Estudio Andrés</div><div className="hv-chat-status">en línea</div></div>
              </div>
              <div className="hv-chat-body">
                <div className="bubble out">Hola, quiero agendar <span className="bubble-time">2:14</span></div>
                <div className="bubble in">
                  ¡Hola Mateo! ☺ Tengo disponible:
                  <div className="bubble-options">
                    <div className="bubble-opt">Vie 8 · 14:00</div>
                    <div className="bubble-opt">Vie 8 · 15:30</div>
                    <div className="bubble-opt">Sáb 9 · 10:00</div>
                  </div>
                  <span className="bubble-time">2:14</span>
                </div>
                <div className="bubble out">El de las 14:00 <span className="bubble-time">2:15</span></div>
                <div className="bubble in">Perfecto. Tu link PSE por $22.500 (50%):<br /><strong>pse.barb.co/ab8x</strong><span className="bubble-time">2:15</span></div>
              </div>
            </div>
            <div className="hv-coin">
              <div><div className="hv-coin-label">No shows</div><div className="hv-coin-big">−66%</div></div>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section className="trust-strip" aria-label="Clientes que confían en MiTurno">
          <div className="trust-inner">
            <div className="trust-label">Confían en nosotros</div>
            <div className="trust-logos">
              {['Estudio Andrés', 'El Bigote Barbería', 'Cuchilla Cl. 70', 'Mr. Hyde', 'Don Pedro Barber Co.'].map((n) => (
                <div className="trust-logo" key={n}>{n}</div>
              ))}
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="section" id="como-funciona" aria-labelledby="howto-title">
          <div className="section-head">
            <div className="section-eyebrow">Así funciona</div>
            <h2 id="howto-title" className="section-title">Tu cliente escribe, <em>todo lo demás se resuelve solo</em>.</h2>
            <p className="section-sub">Cuatro pasos, cero llamadas. El bot atiende 24/7 y solo te avisa cuando ya está pago y confirmado.</p>
          </div>
          <div className="howto-grid">
            {[
              { num: '01', title: 'Tu cliente te escribe',   desc: 'Al mismo WhatsApp de siempre. El bot saluda y muestra el menú de opciones.' },
              { num: '02', title: 'Elige servicio y hora',   desc: 'Le muestras tus precios reales y los horarios disponibles según tu agenda.' },
              { num: '03', title: 'Paga el 50% por PSE',     desc: 'Anticipo automático. Si no paga, la cita no se confirma. Adiós a los no shows.' },
              { num: '04', title: 'Ves la cita en tu panel', desc: 'Tu agenda se actualiza sola. Recordatorios automáticos 24h y 2h antes.' },
            ].map((s) => (
              <article className="howto-step" key={s.num}>
                <div className="howto-num">{s.num}</div>
                <h3 className="howto-title">{s.title}</h3>
                <p className="howto-desc">{s.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="section" id="features" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <div className="section-eyebrow">Para barberos</div>
            <h2 className="section-title">Diseñado para <em>cómo trabajas hoy</em>, no para cambiarte el oficio.</h2>
          </div>
          <div className="feat-grid">
            <div className="feat feat-dark" style={{ gridColumn: 'span 1', gridRow: 'span 2' }}>
              <div className="feat-eyebrow">Pago PSE integrado</div>
              <h3 className="feat-title">El anticipo del 50% se cobra antes de que la silla quede separada.</h3>
              <p className="feat-desc">PSE es el método más usado en Colombia. Sin tarjetas ni apps nuevas.</p>
              <div className="feat-visual">
                <div className="fv-pse">
                  <div className="fv-pse-row"><span>Corte + barba</span><span>$45.000</span></div>
                  <div className="fv-pse-row"><span>Anticipo PSE</span><span className="ok">$22.500 ✓</span></div>
                  <div className="fv-pse-row fv-pse-total"><span>Cobras en sitio</span><span>$22.500</span></div>
                </div>
              </div>
            </div>
            <div className="feat">
              <div className="feat-eyebrow">Agenda viva</div>
              <h3 className="feat-title">Tu horario, tus servicios, tus precios.</h3>
              <p className="feat-desc">Configura una vez. El bot solo ofrece lo disponible.</p>
              <div className="feat-visual" style={{ display: 'flex', gap: 4 }}>
                <div style={{ flex: 1, padding: '6px', background: 'var(--st-green-bg)', border: '1px solid var(--st-green-bd)', borderRadius: 5, fontSize: 11, color: 'var(--st-green-fg)' }}>14:00 · Felipe</div>
                <div style={{ flex: 1, padding: '6px', background: 'var(--st-amber-bg)', border: '1px solid var(--st-amber-bd)', borderRadius: 5, fontSize: 11, color: 'var(--st-amber-fg)' }}>15:00 · Cristian</div>
              </div>
            </div>
            <div className="feat feat-accent">
              <div className="feat-eyebrow">Sin apps extra</div>
              <h3 className="feat-title">Tu cliente no descarga nada.</h3>
              <p className="feat-desc">Todo pasa en el WhatsApp que ya tiene abierto.</p>
            </div>
            <div className="feat" style={{ gridColumn: 'span 2' }}>
              <div className="feat-eyebrow">Ocupación de la semana</div>
              <h3 className="feat-title" style={{ fontSize: 22 }}>Estadísticas que sí entiendes.</h3>
              <p className="feat-desc">Ingresos del día, ocupación, no shows del mes.</p>
              <div className="fv-bars">
                {[60, 78, 55, 86, 79, 42, 12].map((h, i) => (
                  <div key={i} className={`fv-bar${h === 79 ? ' hi' : ''}`} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="feat">
              <div className="feat-eyebrow">Recordatorios</div>
              <h3 className="feat-title">El cliente no se olvida.</h3>
              <p className="feat-desc">Mensaje automático un día antes y 2 horas antes.</p>
              <div className="fv-clock">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                <div><div className="fv-clock-big">−2h</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Recordatorio automático</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* PLANES */}
        <section className="section" id="planes">
          <div className="section-head">
            <div className="section-eyebrow">Planes</div>
            <h2 className="section-title">Un precio honesto. <em>Sin letra pequeña</em>.</h2>
            <p className="section-sub">Empieza gratis 14 días. No te pedimos tarjeta hasta el día 15.</p>
          </div>
          <div className="pricing-grid">
            {[
              { id: 'solo',    name: 'Solo',    price: '$29k', featured: false, features: ['Hasta 100 citas/mes', 'Bot de WhatsApp', 'Pagos PSE', 'Panel web'], ctaLabel: 'Empezar gratis', variant: 'ghost' },
              { id: 'pro',     name: 'Pro',     price: '$59k', featured: true,  features: ['Citas ilimitadas', 'Recordatorios', 'Mensajes personalizados', 'Reportes', 'Soporte WhatsApp'], ctaLabel: 'Empezar con Pro', variant: 'primary' },
              { id: 'estudio', name: 'Estudio', price: '$99k', featured: false, features: ['Todo de Pro', 'Hasta 4 barberos', 'Agendas independientes', 'Vista de estudio', 'Soporte prioritario'], ctaLabel: 'Empezar gratis', variant: 'ghost' },
            ].map((plan) => (
              <article key={plan.id} className={`plan${plan.featured ? ' plan--featured' : ''}`}>
                {plan.featured && <span className="plan-tag">Más popular</span>}
                <div className="plan-name">{plan.name}</div>
                <div className="plan-price-row">
                  <span className="plan-price">{plan.price}</span>
                  <span className="plan-price-unit">/mes</span>
                </div>
                <ul className="plan-features">
                  {plan.features.map((f) => <li key={f} className="plan-feat"><CheckIcon /> {f}</li>)}
                </ul>
                <Link className={`btn ${plan.variant} plan-cta`} to="/registro">{plan.ctaLabel}</Link>
              </article>
            ))}
          </div>
        </section>

        {/* TESTIMONIOS */}
        <section className="section" id="testimonios" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <div className="section-eyebrow">Historias reales</div>
            <h2 className="section-title">"Antes contestaba 80 mensajes al día. <em>Ahora corto pelo</em>."</h2>
          </div>
          <div className="testim">
            <article className="testim-card">
              <p className="testim-quote">"Bajé los no shows de seis por semana a uno. La gente sí llega cuando ya pagó. Mi agenda dejó de ser un caos de WhatsApps."</p>
              <div className="testim-author">
                <div className="testim-avatar">AM</div>
                <div><div className="testim-name">Andrés Mejía</div><div className="testim-role">Estudio Andrés · Medellín · Plan Pro</div></div>
              </div>
            </article>
            <article className="testim-card">
              <p className="testim-quote">"Mis clientes ni se dieron cuenta que era un bot. Siguen escribiendo al mismo número. Yo solo abro el panel y ya está todo cuadrado."</p>
              <div className="testim-author">
                <div className="testim-avatar" style={{ background: 'linear-gradient(140deg, oklch(0.6 0.12 30), oklch(0.45 0.1 20))' }}>JC</div>
                <div><div className="testim-name">Juan Camilo Ríos</div><div className="testim-role">El Bigote · Bogotá · Plan Solo</div></div>
              </div>
            </article>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="cta-banner">
          <div className="cta-banner-inner">
            <h2 className="cta-banner-title">Tu próximo cliente <em>ya te está escribiendo</em>.</h2>
            <p className="cta-banner-sub">Configúralo en 10 minutos. Empieza a cobrar anticipos esta misma semana.</p>
            <div className="hero-cta" style={{ justifyContent: 'center' }}>
              <Link className="btn primary lg" to="/registro">Empezar gratis · 14 días</Link>
              <Link className="btn ghost lg" to="/panel/dashboard">Ver demo del panel</Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="pub-footer">
        <div className="pub-footer-inner">
          <div>
            <Link className="pub-brand" to="/"><div className="brand-mark"><ScissorsIcon /></div><div><div className="pub-brand-name">MiTurno</div><span className="pub-brand-sub">Agenda en WhatsApp</span></div></Link>
            <p className="pf-brand-blurb">La forma más sencilla de profesionalizar tu barbería sin cambiar el WhatsApp que ya usas todos los días.</p>
          </div>
          <div className="pf-col"><h4>Producto</h4><ul><li><a href="#como-funciona">Cómo funciona</a></li><li><a href="#planes">Planes</a></li><li><Link to="/panel/dashboard">Demo</Link></li></ul></div>
          <div className="pf-col"><h4>Cuenta</h4><ul><li><Link to="/login">Iniciar sesión</Link></li><li><Link to="/registro">Crear cuenta</Link></li></ul></div>
          <div className="pf-col"><h4>Soporte</h4><ul><li><a href="/ayuda">Centro de ayuda</a></li><li><a href="/privacidad">Política de privacidad</a></li><li><a href="/terminos">Términos</a></li></ul></div>
        </div>
        <div className="pub-footer-bottom">
          <div>© 2026 MiTurno · Hecho en Medellín 🇨🇴</div>
          <div>Pagos procesados por PSE · NIT 901.XXX.XXX-X</div>
        </div>
      </footer>
    </>
  )
}
