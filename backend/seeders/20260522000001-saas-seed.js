'use strict'

/**
 * Seed SaaS: actualiza barberos existentes con campos SaaS,
 * crea usuarios, planes, un admin y pagos de suscripción de ejemplo.
 */

const ADMIN_ID = 'u0000000-0000-0000-0000-000000000001'
const USER_JUAN_ID = 'u0000000-0000-0000-0000-000000000002'
const USER_PEDRO_ID = 'u0000000-0000-0000-0000-000000000003'
const USER_ANDRES_ID = 'u0000000-0000-0000-0000-000000000004'

const BARBERO_JUAN = 'b0e86958-8686-4e38-967a-0e7845ef2001'
const BARBERO_PEDRO = 'b0e86958-8686-4e38-967a-0e7845ef2002'
const BARBERO_ANDRES = 'b0e86958-8686-4e38-967a-0e7845ef2003'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ── 1. Planes ─────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('planes', [
      {
        id: 'solo',
        nombre: 'Solo',
        precio: 49000,
        citas_maximo: 60,
        features: JSON.stringify([
          'Hasta 60 citas/mes',
          'Bot de WhatsApp',
          'Panel de gestión',
          'Soporte por email',
        ]),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'pro',
        nombre: 'Pro',
        precio: 99000,
        citas_maximo: 200,
        features: JSON.stringify([
          'Hasta 200 citas/mes',
          'Bot de WhatsApp',
          'Panel de gestión',
          'Recordatorios automáticos',
          'Reportes avanzados',
          'Soporte prioritario',
        ]),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'estudio',
        nombre: 'Estudio',
        precio: 199000,
        citas_maximo: null,
        features: JSON.stringify([
          'Citas ilimitadas',
          'Múltiples barberos',
          'Bot de WhatsApp',
          'Panel de gestión avanzado',
          'Recordatorios automáticos',
          'Reportes y métricas',
          'Soporte 24/7',
          'Personalización de marca',
        ]),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])

    // ── 2. Barbero Andrés (nuevo, plan Pro) ───────────────────────────────────
    await queryInterface.bulkInsert('barberos', [
      {
        id: BARBERO_ANDRES,
        nombres: 'Andrés',
        apellidos: 'Mejía',
        celular: '3201112233',
        activo: true,
        direccion: 'Calle 70 # 43-12',
        email: 'andres@elmaestro.com',
        barberia: 'Estudio Barbería · Andrés',
        ciudad: 'Medellín',
        plan: 'pro',
        estado_suscripcion: 'activa',
        alta: '2026-01-15',
        prox_cobro: '2026-06-15',
        citas_maximo: 200,
        citas_mes: 47,
        created_at: new Date('2026-01-15'),
        updated_at: new Date(),
      },
    ])

    // ── 3. Actualizar barberos existentes con campos SaaS ─────────────────────
    await queryInterface.bulkUpdate(
      'barberos',
      {
        barberia: 'Barbería Juan Pérez',
        ciudad: 'Bogotá',
        plan: 'solo',
        estado_suscripcion: 'activa',
        alta: '2026-02-01',
        prox_cobro: '2026-06-01',
        citas_maximo: 60,
        citas_mes: 23,
        updated_at: new Date(),
      },
      { id: BARBERO_JUAN },
    )

    await queryInterface.bulkUpdate(
      'barberos',
      {
        barberia: 'Pedro Gómez Barbershop',
        ciudad: 'Cali',
        plan: 'estudio',
        estado_suscripcion: 'trial',
        alta: '2026-05-01',
        prox_cobro: '2026-06-01',
        citas_maximo: null,
        citas_mes: 8,
        updated_at: new Date(),
      },
      { id: BARBERO_PEDRO },
    )

    // ── 4. Usuarios ───────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('usuarios', [
      {
        id: ADMIN_ID,
        email: 'admin@miturno.app',
        rol: 'admin',
        id_barbero: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: USER_JUAN_ID,
        email: 'juan.perez@miturno.com',
        rol: 'barbero',
        id_barbero: BARBERO_JUAN,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: USER_PEDRO_ID,
        email: 'pedro.gomez@miturno.com',
        rol: 'barbero',
        id_barbero: BARBERO_PEDRO,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: USER_ANDRES_ID,
        email: 'andres@elmaestro.com',
        rol: 'barbero',
        id_barbero: BARBERO_ANDRES,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])

    // ── 5. Horario semanal para Andrés ────────────────────────────────────────
    const horarioAndres = Array.from({ length: 7 }, (_, i) => ({
      id: `hs000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
      id_barbero: BARBERO_ANDRES,
      idx: i,
      activo: i >= 1 && i <= 6, // Lunes a Sábado
      inicio: '09:00',
      fin: '19:00',
      descanso_ini: i >= 1 && i <= 5 ? '13:00' : '',
      descanso_fin: i >= 1 && i <= 5 ? '14:00' : '',
      created_at: new Date(),
      updated_at: new Date(),
    }))
    await queryInterface.bulkInsert('horarios_semanales', horarioAndres)

    // ── 6. Pagos de suscripción de ejemplo ────────────────────────────────────
    await queryInterface.bulkInsert('pagos_suscripcion', [
      {
        id: 'ps000001-0000-0000-0000-000000000001',
        id_barbero: BARBERO_JUAN,
        plan: 'solo',
        monto: 49000,
        fecha: '2026-05-01',
        estado: 'exitoso',
        metodo: 'PSE',
        referencia: 'PSE-20260501-001',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'ps000001-0000-0000-0000-000000000002',
        id_barbero: BARBERO_JUAN,
        plan: 'solo',
        monto: 49000,
        fecha: '2026-04-01',
        estado: 'exitoso',
        metodo: 'PSE',
        referencia: 'PSE-20260401-001',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'ps000001-0000-0000-0000-000000000003',
        id_barbero: BARBERO_ANDRES,
        plan: 'pro',
        monto: 99000,
        fecha: '2026-05-15',
        estado: 'exitoso',
        metodo: 'Tarjeta',
        referencia: 'TRJ-20260515-001',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'ps000001-0000-0000-0000-000000000004',
        id_barbero: BARBERO_ANDRES,
        plan: 'pro',
        monto: 99000,
        fecha: '2026-04-15',
        estado: 'exitoso',
        metodo: 'Tarjeta',
        referencia: 'TRJ-20260415-001',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'ps000001-0000-0000-0000-000000000005',
        id_barbero: BARBERO_PEDRO,
        plan: 'estudio',
        monto: 0,
        fecha: '2026-05-01',
        estado: 'pendiente',
        metodo: 'PSE',
        referencia: 'TRIAL-20260501-001',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])

    // ── 7. Servicios para Andrés ──────────────────────────────────────────────
    await queryInterface.bulkInsert('servicios', [
      {
        id: 'sa000001-0000-0000-0000-000000000001',
        nombre: 'Corte Clásico',
        duracion: 30,
        descripcion: 'Corte tradicional con tijeras y máquina.',
        precio: 30000,
        id_barbero: BARBERO_ANDRES,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'sa000001-0000-0000-0000-000000000002',
        nombre: 'Degradado + Barba',
        duracion: 45,
        descripcion: 'Degradado moderno con arreglo de barba incluido.',
        precio: 50000,
        id_barbero: BARBERO_ANDRES,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('pagos_suscripcion', null, {})
    await queryInterface.bulkDelete('horarios_semanales', null, {})
    await queryInterface.bulkDelete('servicios', {
      id: [
        'sa000001-0000-0000-0000-000000000001',
        'sa000001-0000-0000-0000-000000000002',
      ],
    })
    await queryInterface.bulkDelete('usuarios', null, {})
    await queryInterface.bulkDelete('barberos', { id: BARBERO_ANDRES }, {})
    await queryInterface.bulkDelete('planes', null, {})
  },
}
