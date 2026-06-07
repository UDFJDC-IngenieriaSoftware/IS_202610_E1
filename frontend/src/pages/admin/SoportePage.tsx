/**
 * SoportePage — /admin/soporte
 *
 * Placeholder de la sección de soporte (próximamente).
 */
import { Topbar } from '../../components/organisms/Topbar'
import { Icon }         from '../../components/atoms/Icon'
import { WhatsAppIcon } from '../../components/atoms/WhatsAppIcon'

export function SoportePage() {
  return (
    <div className="page">
      <Topbar
        title="Soporte"
        subtitle="Gestión de tickets y mensajes de barberos"
      />

      <div className="page-body">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 24px',
            gap: 16,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="support_agent" size={28} />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 22,
                marginBottom: 6,
              }}
            >
              Soporte en construcción
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 360 }}>
              Esta sección integrará tickets, chat interno con barberos y un historial de
              conversaciones por WhatsApp. Estará disponible próximamente.
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 8,
            }}
          >
            <button className="btn ghost" type="button">
              <WhatsAppIcon size={15} /> Contactar barbero
            </button>
            <button className="btn primary" type="button">
              <Icon name="notifications" size={15} /> Enviar notificación
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
