const dotenv = require('dotenv');
const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}`, quiet: true });
dotenv.config({ quiet: true });

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);

module.exports = {
  development: {
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres_password',
    database: process.env.POSTGRES_DB || 'bot_db',
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    define: {
      timestamps: true,
      underscored: true
    }
  },
  test: {
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres_password',
    database: process.env.POSTGRES_DB || 'bot_db_test',
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    define: {
      timestamps: true,
      underscored: true
    }
  },
  production: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    define: {
      timestamps: true,
      underscored: true
    }
  }
};
