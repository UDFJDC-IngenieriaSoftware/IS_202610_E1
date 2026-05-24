import * as dotenv from 'dotenv'
const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: `.env.${env}` })
dotenv.config() // fallback

import express, { Request, Response } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { handleMessage, WebhookEntry } from './src/controllers/bot.controller'
import { sequelize } from './src/models'
import whatsappService from './src/whatsapp.factory'
import apiRouter from './src/routes'
import { errorHandler } from './src/middleware/error'
import { ENV } from './src/config/env'

const app = express()

// ─── CORS con credentials (cookie cross-origin en dev) ─────────────────────
app.use(
  cors({
    origin: ENV.FRONTEND_URL,
    credentials: true,
  }),
)

// ─── Body & cookie parsing ──────────────────────────────────────────────────
app.use(express.json())
app.use(cookieParser())

// ─── API REST bajo /api ─────────────────────────────────────────────────────
app.use('/api', apiRouter)

// ─── Solo en DEV — inicializa whatsapp-web.js ─────────────────────────────
if (env === 'development') {
  ;(whatsappService as any).initClient().then((client: any) => {
    client.on('message', async (msg: any) => {
      if (msg.isGroupMsg || msg.isStatus || msg.broadcast) return

      const fakeEntry: WebhookEntry = {
        changes: [
          {
            value: {
              messages: [
                {
                  from: msg.from.replace('@c.us', ''),
                  type: 'text',
                  text: { body: msg.body },
                },
              ],
            },
          },
        ],
      }

      await handleMessage(fakeEntry).catch(console.error)
    })
  }).catch(console.error)
}

// ─── Webhook para Meta API (prod) ────────────────────────────────────────
app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('✅ Webhook verificado')
    return res.status(200).send(challenge)
  }
  return res.sendStatus(403)
})

app.post('/webhook', async (req: Request, res: Response) => {
  console.log('POST webhook')
  res.sendStatus(200)
  const entries: WebhookEntry[] = req.body?.entry ?? []
  for (const entry of entries) {
    await handleMessage(entry).catch(console.error)
  }
})

app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'success', message: 'MiTurno API funcionando!', env })
})

// ─── Manejador central de errores (debe ir ÚLTIMO) ─────────────────────────
app.use(errorHandler)

// ─── Conexión e Inicialización de la Base de Datos ─────────────────────────
const PORT = ENV.PORT

sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Conexión con PostgreSQL establecida exitosamente.')
    if (env === 'development') {
      return sequelize.sync({ alter: true }).then(() => {
        console.log('🔄 Tablas sincronizadas con éxito.')
      })
    }
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} [${env}]`)
    })
  })
  .catch((err: any) => {
    console.error('❌ Error al iniciar la aplicación:', err)
    if (env !== 'development') {
      process.exit(1)
    } else {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} [${env}] (Sin conexión a BD)`)
      })
    }
  })
