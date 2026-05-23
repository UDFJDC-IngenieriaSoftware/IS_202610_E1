'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Crear Tabla Clientes
    await queryInterface.createTable('clientes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      nombres: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      apellidos: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      celular: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 2. Crear Tabla Barberos
    await queryInterface.createTable('barberos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      nombres: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      apellidos: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      celular: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      direccion: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 3. Crear Tabla Servicios
    await queryInterface.createTable('servicios', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      duracion: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      precio: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      id_barbero: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'barberos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 4. Crear Tabla Horarios
    await queryInterface.createTable('horarios', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      hora_inicio: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      hora_fin: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      estado: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'disponible',
      },
      id_servicio: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'servicios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 5. Crear Tabla Citas
    await queryInterface.createTable('citas', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      estado: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pendiente',
      },
      precio: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      id_horario: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'horarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_cliente: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'clientes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 6. Crear Tabla Pagos
    await queryInterface.createTable('pagos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      estado: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pendiente',
      },
      referencia: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      id_cita: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'citas',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 7. Crear Tabla Notificaciones
    await queryInterface.createTable('notificaciones', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      mensaje: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      tipo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cita_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'citas',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Eliminar en orden inverso debido a restricciones de claves foráneas
    await queryInterface.dropTable('notificaciones');
    await queryInterface.dropTable('pagos');
    await queryInterface.dropTable('citas');
    await queryInterface.dropTable('horarios');
    await queryInterface.dropTable('servicios');
    await queryInterface.dropTable('barberos');
    await queryInterface.dropTable('clientes');
  }
};
