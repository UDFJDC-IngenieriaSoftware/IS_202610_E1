'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('horarios_semanales', {
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
      idx: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: { min: 0, max: 6 },
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      inicio: {
        type: Sequelize.STRING(5),
        allowNull: false,
        defaultValue: '09:00',
      },
      fin: {
        type: Sequelize.STRING(5),
        allowNull: false,
        defaultValue: '18:00',
      },
      descanso_ini: {
        type: Sequelize.STRING(5),
        allowNull: false,
        defaultValue: '',
      },
      descanso_fin: {
        type: Sequelize.STRING(5),
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
    // Índice único por barbero + día
    await queryInterface.addIndex('horarios_semanales', ['id_barbero', 'idx'], {
      unique: true,
      name: 'horarios_semanales_barbero_idx_unique',
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('horarios_semanales')
  },
}
