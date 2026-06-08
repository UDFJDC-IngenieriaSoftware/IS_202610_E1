"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn("barberos", "password_hash", { type: Sequelize.STRING, allowNull: true }, { transaction: t });
      await queryInterface.addColumn("barberos", "barberia", { type: Sequelize.STRING, allowNull: true }, { transaction: t });
      await queryInterface.addColumn("barberos", "ciudad", { type: Sequelize.STRING, allowNull: true }, { transaction: t });
      await queryInterface.addColumn("barberos", "rol", { type: Sequelize.STRING, allowNull: false, defaultValue: "barbero" }, { transaction: t });
      await queryInterface.addColumn("barberos", "plan", { type: Sequelize.STRING, allowNull: false, defaultValue: "solo" }, { transaction: t });
      await queryInterface.addIndex("barberos", ["email"], { name: "barberos_email_unique", unique: true, transaction: t });

      await queryInterface.addColumn("servicios", "activo", { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }, { transaction: t });

      await queryInterface.addColumn("pagos", "payment_link_id", { type: Sequelize.STRING, allowNull: true }, { transaction: t });
      await queryInterface.addColumn("pagos", "transaction_id", { type: Sequelize.STRING, allowNull: true }, { transaction: t });
      await queryInterface.addIndex("pagos", ["payment_link_id"], { name: "pagos_payment_link_id_index", transaction: t });

      await queryInterface.createTable("horarios_configuracion", {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
        id_barbero: {
          type: Sequelize.UUID, allowNull: false,
          references: { model: "barberos", key: "id" },
          onUpdate: "CASCADE", onDelete: "CASCADE",
        },
        idx: { type: Sequelize.INTEGER, allowNull: false },
        activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        inicio: { type: Sequelize.STRING(5), allowNull: false },
        fin: { type: Sequelize.STRING(5), allowNull: false },
        descanso_ini: { type: Sequelize.STRING(5), allowNull: false, defaultValue: "" },
        descanso_fin: { type: Sequelize.STRING(5), allowNull: false, defaultValue: "" },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });
      await queryInterface.addIndex("horarios_configuracion", ["id_barbero", "idx"], { name: "horarios_configuracion_barbero_dia_unique", unique: true, transaction: t });

      await queryInterface.createTable("dias_libres", {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
        id_barbero: {
          type: Sequelize.UUID, allowNull: false,
          references: { model: "barberos", key: "id" },
          onUpdate: "CASCADE", onDelete: "CASCADE",
        },
        fecha: { type: Sequelize.DATEONLY, allowNull: false },
        motivo: { type: Sequelize.STRING, allowNull: false, defaultValue: "No disponible" },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });
      await queryInterface.addIndex("dias_libres", ["id_barbero", "fecha"], { name: "dias_libres_barbero_fecha_unique", unique: true, transaction: t });

      await queryInterface.addIndex("citas", ["id_horario"], { name: "citas_horario_unique", unique: true, transaction: t });
      await queryInterface.addIndex("horarios", ["fecha", "id_servicio"], { name: "horarios_fecha_servicio_index", transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex("horarios", "horarios_fecha_servicio_index", { transaction: t });
      await queryInterface.removeIndex("citas", "citas_horario_unique", { transaction: t });
      await queryInterface.dropTable("dias_libres", { transaction: t });
      await queryInterface.dropTable("horarios_configuracion", { transaction: t });
      await queryInterface.removeIndex("pagos", "pagos_payment_link_id_index", { transaction: t });
      await queryInterface.removeColumn("pagos", "transaction_id", { transaction: t });
      await queryInterface.removeColumn("pagos", "payment_link_id", { transaction: t });
      await queryInterface.removeColumn("servicios", "activo", { transaction: t });
      await queryInterface.removeIndex("barberos", "barberos_email_unique", { transaction: t });
      await queryInterface.removeColumn("barberos", "plan", { transaction: t });
      await queryInterface.removeColumn("barberos", "rol", { transaction: t });
      await queryInterface.removeColumn("barberos", "ciudad", { transaction: t });
      await queryInterface.removeColumn("barberos", "barberia", { transaction: t });
      await queryInterface.removeColumn("barberos", "password_hash", { transaction: t });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
