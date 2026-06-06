"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("citas", "reminder_24h_sent", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("citas", "reminder_2h_sent", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addIndex("citas", ["reminder_24h_sent"], {
      name: "citas_reminder_24h_sent_index",
    });

    await queryInterface.addIndex("citas", ["reminder_2h_sent"], {
      name: "citas_reminder_2h_sent_index",
    });

    await queryInterface.addIndex("citas", ["estado", "reminder_24h_sent", "reminder_2h_sent"], {
      name: "citas_reminder_composite_index",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("citas", "citas_reminder_24h_sent_index");
    await queryInterface.removeIndex("citas", "citas_reminder_2h_sent_index");
    await queryInterface.removeIndex("citas", "citas_reminder_composite_index");
    await queryInterface.removeColumn("citas", "reminder_24h_sent");
    await queryInterface.removeColumn("citas", "reminder_2h_sent");
  },
};
