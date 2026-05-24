'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      rol: {
        type: Sequelize.ENUM('admin', 'barbero'),
        allowNull: false,
        defaultValue: 'barbero',
      },
      id_barbero: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'barberos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
    await queryInterface.dropTable('usuarios')
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_usuarios_rol",
    )
  },
}
