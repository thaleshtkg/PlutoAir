import 'dotenv/config.js';
import { Client } from 'pg';

const config = {
  host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
  port: Number(process.env.TEST_DB_PORT || process.env.DB_PORT || 5432),
  user: process.env.TEST_DB_USER || process.env.DB_USER || 'flightuser',
  password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || 'flightpass123',
};

const testDbName = process.env.TEST_DB_NAME || 'flight_booking_test';

const run = async () => {
  const client = new Client({ ...config, database: 'postgres' });
  await client.connect();
  try {
    const existsResult = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [testDbName]
    );
    if (existsResult.rowCount === 0) {
      await client.query(`CREATE DATABASE ${testDbName}`);
      console.log(`✓ Created test database: ${testDbName}`);
    } else {
      console.log(`✓ Test database exists: ${testDbName}`);
    }
  } finally {
    await client.end();
  }

  const testClient = new Client({ ...config, database: testDbName });
  await testClient.connect();
  try {
    await testClient.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    console.log('✓ pgcrypto extension ensured');
  } finally {
    await testClient.end();
  }
};

run().catch((err) => {
  console.error('✗ Failed to setup test database:', err.message);
  process.exit(1);
});
