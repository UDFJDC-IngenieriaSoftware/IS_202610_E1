'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dias_libres', {
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
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      motivo: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
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
    await queryInterface.dropTable('dias_libres')
  },
}
