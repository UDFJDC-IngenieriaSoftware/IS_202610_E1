# WhatsApp Bot — Contexto del proyecto

## Stack

- Node.js + Express
- whatsapp-web.js (dev)
- Meta Business API (prod)
- AWS EC2 (producción)

## Estructura

backend/
├── src/
│ ├── bot.handler.js # lógica del bot, no cambia entre envs
│ ├── whatsapp.factory.js # decide qué servicio usar según NODE_ENV
│ ├── whatsapp.service.js # Meta API (prod)
│ └── whatsapp-local.service.js # whatsapp-web.js (dev)
├── .env.development
├── .env.production
└── app.js

## Decisiones importantes

- Factory pattern para alternar entre dev/prod sin tocar bot.handler.js
- En dev: whatsapp-web.js escucha mensajes directo, no necesita webhook
- En prod: Meta API requiere webhook HTTPS (EC2 + Nginx + Certbot)
- bot.handler.js adapta formato de whatsapp-web.js al mismo que usa Meta

## Pendiente

- [ ] Instalar whatsapp-web.js y probar QR en dev
- [ ] Setup EC2 + Nginx + HTTPS para prod
- [ ] Business Verification en Meta para modo LiveI
