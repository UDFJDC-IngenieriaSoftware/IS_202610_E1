# WhatsApp Bot — Contexto del proyecto

## Stack

- Node.js + Express + TypeScript + tsx
- whatsapp-web.js (dev)
- Meta Business API (prod)
- AWS EC2 (producción)

## Estructura

backend/
├── src/
│   ├── bot.controller.ts       # lógica del bot/webhook (Controlador)
│   ├── whatsapp.factory.ts     # decide qué servicio usar según NODE_ENV
│   ├── whatsapp.service.ts     # Meta API (prod)
│   ├── whatsapp-local.service.ts # whatsapp-web.js (dev)
│   └── services/
│       └── procedure.service.ts  # servicios de dominio (Procedimientos/Servicios)
├── .env.development
├── .env.production
└── app.ts

## Decisiones importantes

- Factory pattern para alternar entre dev/prod sin tocar bot.controller.ts
- En dev: whatsapp-web.js escucha mensajes directo, no necesita webhook
- En prod: Meta API requiere webhook HTTPS (EC2 + Nginx + Certbot)
- bot.controller.ts adapta el formato de whatsapp-web.js al mismo que usa Meta
- Orquestación en el bot.controller: Maneja la lógica llamando directamente a los servicios de dominio (como ProcedureService) y usando whatsappService meramente como canal de entrega.

## Pendiente

- [ ] Instalar whatsapp-web.js y probar QR en dev
- [ ] Setup EC2 + Nginx + HTTPS para prod
- [ ] Business Verification en Meta para modo LiveI
