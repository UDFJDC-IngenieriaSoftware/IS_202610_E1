"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("barberos");

    if (!tableDesc.plazo_cancelacion) {
      await queryInterface.addColumn("barberos", "plazo_cancelacion", {
        type: Sequelize.INTEGER, allowNull: true, defaultValue: null,
      });
    }
    if (!tableDesc.plazo_reprogramacion) {
      await queryInterface.addColumn("barberos", "plazo_reprogramacion", {
        type: Sequelize.INTEGER, allowNull: true, defaultValue: null,
      });
    }
    if (!tableDesc.mensaje_bienvenida) {
      await queryInterface.addColumn("barberos", "mensaje_bienvenida", {
        type: Sequelize.TEXT, allowNull: true, defaultValue: null,
      });
    }
    if (!tableDesc.mensaje_confirmacion) {
      await queryInterface.addColumn("barberos", "mensaje_confirmacion", {
        type: Sequelize.TEXT, allowNull: true, defaultValue: null,
      });
    }
    if (!tableDesc.mensaje_recordatorio) {
      await queryInterface.addColumn("barberos", "mensaje_recordatorio", {
        type: Sequelize.TEXT, allowNull: true, defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable("barberos");
    if (tableDesc.plazo_cancelacion)    await queryInterface.removeColumn("barberos", "plazo_cancelacion");
    if (tableDesc.plazo_reprogramacion) await queryInterface.removeColumn("barberos", "plazo_reprogramacion");
    if (tableDesc.mensaje_bienvenida)   await queryInterface.removeColumn("barberos", "mensaje_bienvenida");
    if (tableDesc.mensaje_confirmacion) await queryInterface.removeColumn("barberos", "mensaje_confirmacion");
    if (tableDesc.mensaje_recordatorio) await queryInterface.removeColumn("barberos", "mensaje_recordatorio");
  },
};
