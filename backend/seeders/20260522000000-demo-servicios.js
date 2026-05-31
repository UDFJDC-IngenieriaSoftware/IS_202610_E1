'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Insertar Barberos
    await queryInterface.bulkInsert('barberos', [
      {
        id: 'b0e86958-8686-4e38-967a-0e7845ef2001',
        nombres: 'Juan',
        apellidos: 'Pérez',
        celular: '3001234567',
        activo: true,
        direccion: 'Calle 10 # 5-20',
        email: 'juan.perez@miturno.com',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'b0e86958-8686-4e38-967a-0e7845ef2002',
        nombres: 'Pedro',
        apellidos: 'Gómez',
        celular: '3109876543',
        activo: true,
        direccion: 'Carrera 15 # 80-45',
        email: 'pedro.gomez@miturno.com',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // 2. Insertar Clientes de prueba
    await queryInterface.bulkInsert('clientes', [
      {
        id: 'c0e86958-8686-4e38-967a-0e7845ef2001',
        nombres: 'Andrés',
        apellidos: 'Demo',
        email: 'demo@miturno.com',
        celular: '573057466435',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // 3. Insertar Servicios ligados a Barberos
    await queryInterface.bulkInsert('servicios', [
      {
        id: 'a0e86958-8686-4e38-967a-0e7845ef2001',
        nombre: 'Corte de Cabello Premium',
        duracion: 30,
        descripcion: 'Corte moderno con lavado premium y peinado con cera de alta fijación.',
        precio: 25000.00,
        id_barbero: 'b0e86958-8686-4e38-967a-0e7845ef2001', // Juan
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'a0e86958-8686-4e38-967a-0e7845ef2002',
        nombre: 'Barba y Toalla Caliente',
        duracion: 20,
        descripcion: 'Afeitado tradicional con toalla caliente, aceites esenciales y masaje facial.',
        precio: 15000.00,
        id_barbero: 'b0e86958-8686-4e38-967a-0e7845ef2001', // Juan
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'a0e86958-8686-4e38-967a-0e7845ef2003',
        nombre: 'Combo Corte + Barba + Bebida',
        duracion: 45,
        descripcion: 'El servicio completo: corte, barba, perfilado y una bebida fría de cortesía.',
        precio: 35000.00,
        id_barbero: 'b0e86958-8686-4e38-967a-0e7845ef2001', // Juan
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'a0e86958-8686-4e38-967a-0e7845ef2004',
        nombre: 'Corte Infantil',
        duracion: 25,
        descripcion: 'Corte dinámico para niños menores de 12 años con trato especial y dulce de cortesía.',
        precio: 18000.00,
        id_barbero: 'b0e86958-8686-4e38-967a-0e7845ef2002', // Pedro
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'a0e86958-8686-4e38-967a-0e7845ef2005',
        nombre: 'Lavado e Hidratación Capilar',
        duracion: 15,
        descripcion: 'Tratamiento purificante para el cuero cabelludo con masajes relajantes.',
        precio: 12000.00,
        id_barbero: 'b0e86958-8686-4e38-967a-0e7845ef2002', // Pedro
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // 3. Insertar Horarios (Bloques de Trabajo) de muestra para los servicios
    await queryInterface.bulkInsert('horarios', [
      {
        id: 'f0e86958-8686-4e38-967a-0e7845ef2001',
        fecha: '2026-06-23',
        hora_inicio: '09:00:00',
        hora_fin: '09:30:00',
        estado: 'disponible',
        id_servicio: 'a0e86958-8686-4e38-967a-0e7845ef2001', // Corte Premium (Juan)
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'f0e86958-8686-4e38-967a-0e7845ef2002',
        fecha: '2026-06-23',
        hora_inicio: '10:00:00',
        hora_fin: '10:30:00',
        estado: 'disponible',
        id_servicio: 'a0e86958-8686-4e38-967a-0e7845ef2001', // Corte Premium (Juan)
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'f0e86958-8686-4e38-967a-0e7845ef2003',
        fecha: '2026-06-23',
        hora_inicio: '11:00:00',
        hora_fin: '11:20:00',
        estado: 'disponible',
        id_servicio: 'a0e86958-8686-4e38-967a-0e7845ef2002', // Barba (Juan)
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'f0e86958-8686-4e38-967a-0e7845ef2004',
        fecha: '2026-06-23',
        hora_inicio: '14:00:00',
        hora_fin: '14:25:00',
        estado: 'disponible',
        id_servicio: 'a0e86958-8686-4e38-967a-0e7845ef2004', // Corte Infantil (Pedro)
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // Eliminar en orden inverso respetando FKs
    await queryInterface.bulkDelete('horarios', null, {});
    await queryInterface.bulkDelete('servicios', null, {});
    await queryInterface.bulkDelete('barberos', null, {});
    await queryInterface.bulkDelete('clientes', null, {});
  }
};
