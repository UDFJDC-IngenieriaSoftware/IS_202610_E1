"use strict";

const { pbkdf2Sync, randomBytes } = require("node:crypto");

function passwordHash(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

const DAYS = [
  { idx: 0, activo: false, inicio: "10:00", fin: "14:00", descanso_ini: "", descanso_fin: "" },
  { idx: 1, activo: true, inicio: "09:00", fin: "19:00", descanso_ini: "13:00", descanso_fin: "14:00" },
  { idx: 2, activo: true, inicio: "09:00", fin: "19:00", descanso_ini: "13:00", descanso_fin: "14:00" },
  { idx: 3, activo: true, inicio: "09:00", fin: "19:00", descanso_ini: "13:00", descanso_fin: "14:00" },
  { idx: 4, activo: true, inicio: "09:00", fin: "20:00", descanso_ini: "13:00", descanso_fin: "14:00" },
  { idx: 5, activo: true, inicio: "09:00", fin: "20:00", descanso_ini: "13:00", descanso_fin: "14:00" },
  { idx: 6, activo: true, inicio: "08:00", fin: "18:00", descanso_ini: "12:30", descanso_fin: "13:30" },
];

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkUpdate(
      "barberos",
      {
        password_hash: passwordHash("Demo1234"),
        barberia: "MiTurno Centro",
        ciudad: "Bogota",
        plan: "pro",
        updated_at: now,
      },
      { email: "juan.perez@miturno.com" },
    );
    await queryInterface.bulkUpdate(
      "barberos",
      {
        password_hash: passwordHash("Demo1234"),
        barberia: "MiTurno Norte",
        ciudad: "Medellin",
        updated_at: now,
      },
      { email: "pedro.gomez@miturno.com" },
    );
    const rows = [
      ["b0e86958-8686-4e38-967a-0e7845ef2001", "11111111"],
      ["b0e86958-8686-4e38-967a-0e7845ef2002", "22222222"],
    ].flatMap(([idBarbero, prefix]) =>
      DAYS.map((day) => ({
        id: `${prefix}-0000-4000-8000-00000000000${day.idx}`,
        id_barbero: idBarbero,
        ...day,
        created_at: now,
        updated_at: now,
      })),
    );
    await queryInterface.bulkInsert("horarios_configuracion", rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("horarios_configuracion", {
      id_barbero: [
        "b0e86958-8686-4e38-967a-0e7845ef2001",
        "b0e86958-8686-4e38-967a-0e7845ef2002",
      ],
    });
    await queryInterface.bulkUpdate(
      "barberos",
      { password_hash: null, barberia: null, ciudad: null },
      { email: ["juan.perez@miturno.com", "pedro.gomez@miturno.com"] },
    );
  },
};
