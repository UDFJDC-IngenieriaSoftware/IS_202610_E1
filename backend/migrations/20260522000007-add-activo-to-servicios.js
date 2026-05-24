'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('servicios', 'activo', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('servicios', 'activo')
  },
}
