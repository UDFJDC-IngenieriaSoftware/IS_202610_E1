'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('planes', {
      id: {
        type: Sequelize.STRING(20),
        primaryKey: true,
        allowNull: false,
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      precio: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      citas_maximo: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      features: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: '[]',
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
    await queryInterface.dropTable('planes')
  },
}
