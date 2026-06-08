"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add refund-related fields to pagos table
    await queryInterface.addColumn("pagos", "refund_status", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      comment: "Refund status: pendiente, exitoso, fallido",
    });

    await queryInterface.addColumn("pagos", "refund_transaction_id", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      comment: "Wompi refund transaction ID",
    });

    await queryInterface.addColumn("pagos", "refund_reason", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      comment: "Reason for refund",
    });

    await queryInterface.addColumn("pagos", "refunded_at", {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
      comment: "Timestamp when refund was processed",
    });

    // Add index for refund queries
    await queryInterface.addIndex("pagos", ["refund_status"], {
      name: "pagos_refund_status_index",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index
    await queryInterface.removeIndex("pagos", "pagos_refund_status_index");

    // Remove columns
    await queryInterface.removeColumn("pagos", "refund_status");
    await queryInterface.removeColumn("pagos", "refund_transaction_id");
    await queryInterface.removeColumn("pagos", "refund_reason");
    await queryInterface.removeColumn("pagos", "refunded_at");
  },
};
