'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pagos_suscripcion', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      id_barbero: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'barberos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      plan: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      monto: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      estado: {
        type: Sequelize.ENUM('exitoso', 'fallido', 'pendiente'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      metodo: {
        type: Sequelize.ENUM('PSE', 'Tarjeta'),
        allowNull: false,
      },
      referencia: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pagos_suscripcion')
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_pagos_suscripcion_estado",
    )
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_pagos_suscripcion_metodo",
    )
  },
}
