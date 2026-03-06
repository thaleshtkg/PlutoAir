import 'dotenv/config.js';

export const knexConfig = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'flightuser',
      password: process.env.DB_PASSWORD || 'flightpass123',
      database: process.env.DB_NAME || 'flight_booking',
      port: process.env.DB_PORT || 5432,
    },
    migrations: {
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },
  test: {
    client: 'pg',
    connection: {
      host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
      user: process.env.TEST_DB_USER || process.env.DB_USER || 'flightuser',
      password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || 'flightpass123',
      database: process.env.TEST_DB_NAME || 'flight_booking_test',
      port: process.env.TEST_DB_PORT || process.env.DB_PORT || 5432,
    },
    migrations: {
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
    // Keep a single connection so BEGIN/ROLLBACK wraps API requests in tests.
    pool: {
      min: 1,
      max: 1,
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },
};

export default knexConfig;
