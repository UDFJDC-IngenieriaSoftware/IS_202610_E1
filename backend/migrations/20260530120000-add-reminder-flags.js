"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add reminder flags to bookings table
    await queryInterface.addColumn("bookings", "reminder_24h_sent", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Flag indicating if 24h reminder has been sent",
    });

    await queryInterface.addColumn("bookings", "reminder_2h_sent", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Flag indicating if 2h reminder has been sent",
    });

    // Add indexes for efficient querying in reminder job
    await queryInterface.addIndex("bookings", ["reminder_24h_sent"], {
      name: "bookings_reminder_24h_sent_index",
    });

    await queryInterface.addIndex("bookings", ["reminder_2h_sent"], {
      name: "bookings_reminder_2h_sent_index",
    });

    // Add composite index for reminder job queries
    await queryInterface.addIndex("bookings", ["status", "reminder_24h_sent", "reminder_2h_sent"], {
      name: "bookings_reminder_composite_index",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex("bookings", "bookings_reminder_24h_sent_index");
    await queryInterface.removeIndex("bookings", "bookings_reminder_2h_sent_index");
    await queryInterface.removeIndex("bookings", "bookings_reminder_composite_index");

    // Remove columns
    await queryInterface.removeColumn("bookings", "reminder_24h_sent");
    await queryInterface.removeColumn("bookings", "reminder_2h_sent");
  },
};
