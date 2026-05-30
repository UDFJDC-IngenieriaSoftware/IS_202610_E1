// Jest setup file
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5433";
process.env.POSTGRES_DB = "bot_db_test";
process.env.POSTGRES_USER = "postgres";
process.env.POSTGRES_PASSWORD = "postgres_password";
process.env.LOG_LEVEL = "error";

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};
