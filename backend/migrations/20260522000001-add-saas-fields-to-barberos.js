'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('barberos', 'barberia', {
      type: Sequelize.STRING,
      allowNull: true,
    })
    await queryInterface.addColumn('barberos', 'ciudad', {
      type: Sequelize.STRING,
      allowNull: true,
    })
    await queryInterface.addColumn('barberos', 'plan', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: 'solo',
    })
    await queryInterface.addColumn('barberos', 'estado_suscripcion', {
      type: Sequelize.ENUM('activa', 'trial', 'morosa', 'cancelada'),
      allowNull: true,
      defaultValue: 'trial',
    })
    await queryInterface.addColumn('barberos', 'alta', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    })
    await queryInterface.addColumn('barberos', 'prox_cobro', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    })
    await queryInterface.addColumn('barberos', 'citas_maximo', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
    await queryInterface.addColumn('barberos', 'citas_mes', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('barberos', 'barberia')
    await queryInterface.removeColumn('barberos', 'ciudad')
    await queryInterface.removeColumn('barberos', 'plan')
    await queryInterface.removeColumn('barberos', 'estado_suscripcion')
    await queryInterface.removeColumn('barberos', 'alta')
    await queryInterface.removeColumn('barberos', 'prox_cobro')
    await queryInterface.removeColumn('barberos', 'citas_maximo')
    await queryInterface.removeColumn('barberos', 'citas_mes')
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_barberos_estado_suscripcion",
    )
  },
}
