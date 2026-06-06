'use strict'

/**
 * seed-e2e.js — datos de prueba para los tests E2E de Playwright.
 *
 * Uso:
 *   node scripts/seed-e2e.js            → setup  (inserta cita de prueba)
 *   node scripts/seed-e2e.js --teardown → teardown (elimina cita de prueba)
 *
 * Resuelve el problema de que el seed principal NO inserta citas,
 * por lo que /api/clientes devuelve [] y los tests de CU-09/CU-10 fallan.
 */

require('dotenv').config()

const { Pool } = require('pg')

const DB = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 5433,
  database: process.env.POSTGRES_DB || 'bot_db',
  user:     process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres_password',
}

// IDs del seed 20260522000000-demo-servicios.js
const ID_CITA_TEST    = 'e2e00000-0000-4000-8000-000000000001'
const ID_CLIENTE_TEST = 'c0e86958-8686-4e38-967a-0e7845ef2001' // Andrés Demo
const ID_HORARIO_TEST = 'f0e86958-8686-4e38-967a-0e7845ef2001' // Corte Premium (Juan)
const PRECIO_TEST     = 25000

async function setup(pool) {
  await pool.query(
    `UPDATE horarios SET estado = 'reservado' WHERE id = $1`,
    [ID_HORARIO_TEST],
  )
  await pool.query(
    `INSERT INTO citas (id, id_cliente, id_horario, estado, precio, created_at, updated_at)
     VALUES ($1, $2, $3, 'confirmada', $4, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET estado = 'confirmada', updated_at = NOW()`,
    [ID_CITA_TEST, ID_CLIENTE_TEST, ID_HORARIO_TEST, PRECIO_TEST],
  )
  console.log('[seed-e2e] ✅ Cita de prueba insertada')
}

async function teardown(pool) {
  await pool.query(`DELETE FROM citas    WHERE id = $1`, [ID_CITA_TEST])
  await pool.query(`UPDATE horarios SET estado = 'disponible' WHERE id = $1`, [ID_HORARIO_TEST])
  console.log('[seed-e2e] ✅ Datos de prueba eliminados')
}

;(async () => {
  const pool = new Pool(DB)
  try {
    const isTeardown = process.argv.includes('--teardown')
    if (isTeardown) {
      await teardown(pool)
    } else {
      await setup(pool)
    }
  } catch (err) {
    console.error('[seed-e2e] ❌ Error:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
})()
