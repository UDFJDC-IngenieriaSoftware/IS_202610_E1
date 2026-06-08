# MiTurno Backend

API REST para agenda de barberias, construida sobre Express, TypeScript,
Sequelize y PostgreSQL. El backend conserva el bot de WhatsApp existente y
agrega el nucleo web del plan de implementacion.

## Alcance implementado

- Sesion JWT: registro, login, refresh, perfil y cambio de contrasena. El token
  se devuelve en el cuerpo (`{ token, perfil, rol }`) y tambien en una cookie
  `HttpOnly`; las rutas protegidas aceptan `Authorization: Bearer <token>` o la
  cookie.
- Servicios del barbero con validacion y baja logica.
- Horario semanal y dias libres.
- Calculo de disponibilidad, creacion y administracion de citas.
- Consulta y actualizacion de clientes vinculados a la agenda del barbero.
- Anticipo del 50% con link Wompi cuando hay credenciales configuradas.
- Webhooks de WhatsApp y pagos; el webhook de Wompi valida la firma y el monto
  antes de confirmar una cita.
- Recordatorios automaticos de citas por WhatsApp (24h y 2h antes de la cita)
  mediante un job programado con reintentos. La zona horaria se fija en
  `America/Bogota` para que los recordatorios se disparen a la hora local.
- Cabeceras de seguridad, CORS restringido, rate limiting y manejo uniforme de
  errores.

La integracion real con Meta y Wompi requiere credenciales del entorno; sin
llaves de Wompi las reservas se guardan como pendientes sin link de pago.

## Inicio local

```bash
copy .env.example .env.development
npm install
npm run migrate
npm run seed
npm run dev
```

PostgreSQL debe estar disponible con la configuracion de `.env.development`.
Con Docker Compose de desarrollo se publica en `localhost:5433` para no
colisionar con otras bases locales.
La sincronizacion automatica de Sequelize esta desactivada; se usan
migraciones. Para iniciar el cliente local de WhatsApp establece
`ENABLE_WHATSAPP_LOCAL=true`.

Usuario semilla:

```text
juan.perez@miturno.com / Demo1234
```

## Rutas

El panel actual consume los aliases en espanol bajo `/api`:

| Metodo | Ruta | Uso |
| --- | --- | --- |
| POST | `/api/auth/register` | Crear cuenta |
| POST | `/api/auth/login` | Iniciar sesion |
| GET | `/api/auth/me` | Perfil autenticado |
| GET/POST/PATCH/DELETE | `/api/servicios` | Servicios |
| GET/PATCH | `/api/horario` | Horario semanal |
| GET/POST/DELETE | `/api/horario/dias-libres` | Excepciones |
| POST | `/api/citas/disponibilidad` | Slots disponibles (publico) |
| GET/PATCH | `/api/citas` | Gestion de agenda |
| GET | `/api/citas/stats` | Metricas de la agenda |
| GET | `/api/clientes` | Clientes de la agenda |
| GET | `/api/pagos` | Pagos del barbero |
| POST | `/api/pagos/link` | Crear link de anticipo Wompi |
| POST | `/api/webhook/payment` | Webhook de pagos (Wompi) |

Los endpoints equivalentes del plan se exponen en `/api/v1`:

```text
/api/v1/auth
/api/v1/services
/api/v1/schedule
/api/v1/bookings
/api/v1/payments
/api/v1/customers
/api/v1/webhook/whatsapp
/api/v1/webhook/payment
```

## Wompi

Configura `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_API_URL` y
`PAYMENT_REDIRECT_URL`. El backend crea links de pago del anticipo y relaciona
el evento `transaction.updated` mediante `payment_link_id`.

## Verificacion

```bash
npm run build
npm test
```
