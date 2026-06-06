'use strict'

/**
 * seed-e2e.js — datos de prueba para los tests E2E de Playwright.
 *
 * Uso:
 *   node scripts/seed-e2e.js            → setup  (inserta cita de prueba)
 *   node scripts/seed-e2e.js --teardown → teardown (elimina cita de prueba)
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

// ── IDs del seed ──────────────────────────────────────────────────────────────

// Horarios del seeder demo (23-jun-2026, barbero Juan)
const ID_HORARIO_1 = 'f0e86958-8686-4e38-967a-0e7845ef2001' // 09:00 Corte Premium
const ID_HORARIO_2 = 'f0e86958-8686-4e38-967a-0e7845ef2002' // 10:00 Corte Premium
const ID_HORARIO_3 = 'f0e86958-8686-4e38-967a-0e7845ef2003' // 11:00 Barba

// Horario extra para CU-05 — creado en setup, eliminado en teardown (Juan, 24-jun-2026)
const ID_HORARIO_5      = 'f0e86958-8686-4e38-967a-0e7845ef2005' // 09:00 Corte Premium
const ID_SERVICIO_CORTE = 'a0e86958-8686-4e38-967a-0e7845ef2001'

// Citas
const ID_CITA_1 = 'e2e00000-0000-4000-8000-000000000001' // CU-08/09/10: confirmada
const ID_CITA_2 = 'e2e00000-0000-4000-8000-000000000002' // CU-04: pendiente → APPROVED
const ID_CITA_3 = 'e2e00000-0000-4000-8000-000000000003' // CU-04: pendiente → DECLINED
const ID_CITA_4 = 'e2e00000-0000-4000-8000-000000000004' // CU-05: confirmada → cancelar

// Clientes
const ID_CLIENTE = 'c0e86958-8686-4e38-967a-0e7845ef2001' // Andrés Demo

// Pagos (CU-04)
const ID_PAGO_2 = 'e2e00000-0000-4000-8000-000000000012'
const ID_PAGO_3 = 'e2e00000-0000-4000-8000-000000000013'

const PRECIO   = 25000
const ANTICIPO = 12500  // 50% del precio

// Referencias para el webhook de Wompi (usadas en cu04-pago.spec.ts)
const REF_PAGO_2 = 'miturno-e2e-pago-002'
const REF_PAGO_3 = 'miturno-e2e-pago-003'

async function setup(pool) {
  // ── Horarios del demo → reservado ────────────────────────────────────────
  await pool.query(
    `UPDATE horarios SET estado = 'reservado' WHERE id = ANY($1)`,
    [[ID_HORARIO_1, ID_HORARIO_2, ID_HORARIO_3]],
  )

  // ── Horario 5: slot extra para CU-05 (Juan, 08-jul-2026, 09:00) ──────────
  // Usar jul-08 (semana diferente a jun-23) para evitar race condition
  // con el test UI de CU-04 que cuenta eventos en la semana jun-20/26.
  await pool.query(
    `INSERT INTO horarios (id, fecha, hora_inicio, hora_fin, estado, id_servicio, created_at, updated_at)
     VALUES ($1, '2026-07-08', '09:00', '09:30', 'reservado', $2, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET estado = 'reservado', updated_at = NOW()`,
    [ID_HORARIO_5, ID_SERVICIO_CORTE],
  )

  // ── Cita 1: confirmada (CU-08/09/10) ─────────────────────────────────────
  await pool.query(
    `INSERT INTO citas (id, id_cliente, id_horario, estado, precio, created_at, updated_at)
     VALUES ($1, $2, $3, 'confirmada', $4, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET estado = 'confirmada', updated_at = NOW()`,
    [ID_CITA_1, ID_CLIENTE, ID_HORARIO_1, PRECIO],
  )

  // ── Cita 2: pendiente (CU-04 APPROVED flow) ───────────────────────────────
  await pool.query(
    `INSERT INTO citas (id, id_cliente, id_horario, estado, precio, created_at, updated_at)
     VALUES ($1, $2, $3, 'pendiente', $4, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET estado = 'pendiente', updated_at = NOW()`,
    [ID_CITA_2, ID_CLIENTE, ID_HORARIO_2, PRECIO],
  )
  await pool.query(
    `INSERT INTO pagos (id, id_cita, monto, estado, referencia, created_at, updated_at)
     VALUES ($1, $2, $3, 'pendiente', $4, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET estado = 'pendiente', monto = $3, referencia = $4, updated_at = NOW()`,
    [ID_PAGO_2, ID_CITA_2, ANTICIPO, REF_PAGO_2],
  )

  // ── Cita 3: pendiente (CU-04 DECLINED flow) ───────────────────────────────
  await pool.query(
    `INSERT INTO citas (id, id_cliente, id_horario, estado, precio, created_at, updated_at)
     VALUES ($1, $2, $3, 'pendiente', $4, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET estado = 'pendiente', updated_at = NOW()`,
    [ID_CITA_3, ID_CLIENTE, ID_HORARIO_3, PRECIO],
  )
  await pool.query(
    `INSERT INTO pagos (id, id_cita, monto, estado, referencia, created_at, updated_at)
     VALUES ($1, $2, $3, 'pendiente', $4, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET estado = 'pendiente', monto = $3, referencia = $4, updated_at = NOW()`,
    [ID_PAGO_3, ID_CITA_3, ANTICIPO, REF_PAGO_3],
  )

  // ── Cita 4: confirmada (CU-05 cancelar — usa horario 5, Juan, 24-jun-2026) ─
  await pool.query(
    `INSERT INTO citas (id, id_cliente, id_horario, estado, precio, created_at, updated_at)
     VALUES ($1, $2, $3, 'confirmada', $4, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET estado = 'confirmada', updated_at = NOW()`,
    [ID_CITA_4, ID_CLIENTE, ID_HORARIO_5, PRECIO],
  )

  console.log('[seed-e2e] ✅ Citas y pagos de prueba insertados (2 confirmadas + 2 pendientes)')
}

async function teardown(pool) {
  await pool.query(`DELETE FROM pagos WHERE id = ANY($1)`, [[ID_PAGO_2, ID_PAGO_3]])
  // También eliminar pagos extra que pudo crear POST /api/pagos/link
  await pool.query(`DELETE FROM pagos WHERE referencia LIKE 'miturno-e2e-%' AND id NOT IN ($1, $2)`, [ID_PAGO_2, ID_PAGO_3])
  await pool.query(`DELETE FROM citas WHERE id = ANY($1)`, [[ID_CITA_1, ID_CITA_2, ID_CITA_3, ID_CITA_4]])
  await pool.query(`UPDATE horarios SET estado = 'disponible' WHERE id = ANY($1)`, [[ID_HORARIO_1, ID_HORARIO_2, ID_HORARIO_3]])
  // Eliminar el horario extra que se creó en setup (no existía en el seeder original)
  await pool.query(`DELETE FROM horarios WHERE id = $1`, [ID_HORARIO_5])
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
