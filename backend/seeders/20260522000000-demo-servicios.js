'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('servicios', [
      {
        id: 'a0e86958-8686-4e38-967a-0e7845ef2001',
        nombre: 'Corte de Cabello Premium',
        precio: 25000.00,
        duracion: 30,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'a0e86958-8686-4e38-967a-0e7845ef2002',
        nombre: 'Barba y Toalla Caliente',
        precio: 15000.00,
        duracion: 20,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'a0e86958-8686-4e38-967a-0e7845ef2003',
        nombre: 'Combo Corte + Barba + Bebida',
        precio: 35000.00,
        duracion: 45,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'a0e86958-8686-4e38-967a-0e7845ef2004',
        nombre: 'Corte Infantil',
        precio: 18000.00,
        duracion: 25,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'a0e86958-8686-4e38-967a-0e7845ef2005',
        nombre: 'Lavado e Hidratación Capilar',
        precio: 12000.00,
        duracion: 15,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('servicios', null, {});
  }
};
