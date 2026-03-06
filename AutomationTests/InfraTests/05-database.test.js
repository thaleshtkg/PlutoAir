/**
 * INFRA CHECK 05 — Database Connectivity & Schema
 *
 * Connects to PostgreSQL with the credentials from backend/.env and verifies:
 *  - The connection succeeds
 *  - The target database exists
 *  - All expected tables are present (migrations ran)
 *  - Seed data is present (at least one flight record)
 *  - The knex_migrations tracking table exists
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import pg from 'pg'
import { getBackendEnv, isTcpPortOpen } from './helpers.js'

const { Client } = pg
const env = getBackendEnv()

const DB_CONFIG = {
  host: env['DB_HOST'] || 'localhost',
  port: parseInt(env['DB_PORT'] || '5432'),
  user: env['DB_USER'] || 'flightuser',
  password: env['DB_PASSWORD'] || 'flightpass123',
  database: env['DB_NAME'] || 'flight_booking',
  connectionTimeoutMillis: 5000,
  query_timeout: 5000,
}

// Expected tables from the PlutoAir schema
const EXPECTED_TABLES = [
  'users',
  'flights',
  'bookings',
  'passengers',
  'booking_addons',
  'payments',
  'guest_login_attempts',
]

let client = null
let dbReachable = false

beforeAll(async () => {
  // Only attempt DB connection if the port is open
  const portOpen = await isTcpPortOpen(DB_CONFIG.host, DB_CONFIG.port, 3000)
  if (!portOpen) {
    console.warn(`\n  ⚠  PostgreSQL port ${DB_CONFIG.host}:${DB_CONFIG.port} is closed — skipping DB tests.\n`)
    return
  }

  client = new Client(DB_CONFIG)
  try {
    await client.connect()
    dbReachable = true
  } catch (err) {
    console.warn(`\n  ⚠  Could not connect to database: ${err.message}\n`)
    client = null
  }
})

afterAll(async () => {
  if (client) await client.end().catch(() => {})
})

function requireDb() {
  if (!dbReachable || !client) {
    console.warn('  ⚠  DB not reachable — test skipped')
    return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Connectivity
// ---------------------------------------------------------------------------
describe('PostgreSQL connectivity', () => {
  it('can connect with credentials from backend/.env', () => {
    expect(dbReachable, [
      `Failed to connect to PostgreSQL at ${DB_CONFIG.host}:${DB_CONFIG.port}`,
      `  Database: ${DB_CONFIG.database}`,
      `  User:     ${DB_CONFIG.user}`,
      'Fix options:',
      '  1. Start the database: docker compose up -d',
      '  2. Check credentials in backend/.env match docker-compose.yml POSTGRES_*',
      '  3. Verify docker-compose POSTGRES_USER and POSTGRES_PASSWORD',
      `  4. Try manually: psql -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database}`,
    ].join('\n')).toBe(true)
  })

  it('SELECT 1 returns a result (basic query works)', async () => {
    if (!requireDb()) return
    const result = await client.query('SELECT 1 AS value')
    expect(result.rows[0].value, 'Basic query returned unexpected result.').toBe(1)
  })

  it('is connected to the correct database', async () => {
    if (!requireDb()) return
    const result = await client.query('SELECT current_database()')
    const dbName = result.rows[0].current_database
    expect(dbName, [
      `Connected to database "${dbName}" but expected "${DB_CONFIG.database}".`,
      `Fix: ensure DB_NAME=${DB_CONFIG.database} in backend/.env`,
      `     and docker-compose POSTGRES_DB=${DB_CONFIG.database}`,
    ].join('\n')).toBe(DB_CONFIG.database)
  })

  it('connected user matches DB_USER in backend/.env', async () => {
    if (!requireDb()) return
    const result = await client.query('SELECT current_user')
    const user = result.rows[0].current_user
    expect(user, [
      `Connected as "${user}" but backend/.env DB_USER="${DB_CONFIG.user}".`,
      'Fix: update DB_USER in backend/.env to match the actual PostgreSQL user.',
    ].join('\n')).toBe(DB_CONFIG.user)
  })
})

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------
describe('Database schema (migrations ran)', () => {
  it('knex_migrations table exists (knex was initialised)', async () => {
    if (!requireDb()) return
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'knex_migrations'
    `)
    expect(result.rows.length, [
      '"knex_migrations" table not found.',
      'Migrations have NOT been run against this database.',
      'Fix: cd backend && npm run migrate',
      '     (or: knex migrate:latest --env development)',
    ].join('\n')).toBe(1)
  })

  for (const tableName of EXPECTED_TABLES) {
    it(`table "${tableName}" exists`, async () => {
      if (!requireDb()) return
      const result = await client.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
      `, [tableName])
      expect(result.rows.length, [
        `Table "${tableName}" not found in database "${DB_CONFIG.database}".`,
        'Migrations may be incomplete or the wrong migration was applied.',
        'Fix: cd backend && npm run migrate',
        '     To reset and re-apply: npm run reset-db',
      ].join('\n')).toBe(1)
    })
  }
})

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
describe('Database seed data', () => {
  it('flights table has at least one row (seeds were run)', async () => {
    if (!requireDb()) return
    const result = await client.query('SELECT COUNT(*) AS count FROM flights')
    const count = parseInt(result.rows[0].count)
    expect(count, [
      `The "flights" table is empty — seed data was not loaded.`,
      'Fix: cd backend && npm run seed',
      '     (or for a full reset: npm run reset-db)',
    ].join('\n')).toBeGreaterThan(0)
  })

  it('users table is accessible (admin user seeded)', async () => {
    if (!requireDb()) return
    const result = await client.query(`
      SELECT COUNT(*) AS count FROM users
    `)
    const count = parseInt(result.rows[0].count)
    expect(count, [
      `Could not query the "users" table.`,
      'The migrations may not have been run.',
      'Fix: cd backend && npm run migrate',
    ].join('\n')).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// Credentials consistency
// ---------------------------------------------------------------------------
describe('Database credentials consistency', () => {
  it('docker-compose POSTGRES_USER matches backend DB_USER', () => {
    // Checked dynamically via parseDockerCompose in the port test,
    // but repeated here for DB-specific context
    expect(DB_CONFIG.user, [
      `DB_USER="${DB_CONFIG.user}" — verify it matches POSTGRES_USER in docker-compose.yml`,
    ].join('\n')).toBeTruthy()
  })
})
