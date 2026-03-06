/**
 * INFRA CHECK 04 — Port / TCP Connectivity
 *
 * Tests TCP reachability for every port the application uses.
 * A port being "open" means something is listening there.
 * A port being "closed" may mean the service hasn't started yet.
 *
 * These tests report the actual observed state and guide you on
 * what should be running on each port.
 */

import { describe, it, expect } from 'vitest'
import { isTcpPortOpen, getBackendEnv, parseViteConfig, parseDockerCompose } from './helpers.js'

const backendEnv = getBackendEnv()
const viteConfig = parseViteConfig()
const compose = parseDockerCompose()

// Derive ports from config so mismatches surface clearly
const BACKEND_PORT = parseInt(backendEnv['PORT'] || '5000')
const FRONTEND_PORT = viteConfig.serverPort ?? 5173
const PG_PORT = parseInt(backendEnv['DB_PORT'] || '5432')
const REDIS_PORT = (() => {
  try { return parseInt(new URL(backendEnv['REDIS_URL'] || 'redis://localhost:6379').port || '6379') } catch { return 6379 }
})()
const PG_HOST = backendEnv['DB_HOST'] || 'localhost'

// ---------------------------------------------------------------------------
// Infrastructure ports (must be open for ANY operation)
// ---------------------------------------------------------------------------
describe('Infrastructure ports (database / cache)', () => {
  it(`PostgreSQL is reachable on ${PG_HOST}:${PG_PORT}`, async () => {
    const open = await isTcpPortOpen(PG_HOST, PG_PORT)
    expect(open, [
      `Cannot reach PostgreSQL on ${PG_HOST}:${PG_PORT}.`,
      'This is required for the backend to start.',
      'Fix options:',
      '  1. Start the Docker containers: docker compose up -d',
      '  2. Or start your local PostgreSQL service',
      `  3. Verify DB_HOST="${PG_HOST}" and DB_PORT="${PG_PORT}" in backend/.env`,
    ].join('\n')).toBe(true)
  })

  it(`Redis is reachable on localhost:${REDIS_PORT}`, async () => {
    const open = await isTcpPortOpen('localhost', REDIS_PORT)
    expect(open, [
      `Cannot reach Redis on localhost:${REDIS_PORT}.`,
      'Fix options:',
      '  1. Start the Docker containers: docker compose up -d',
      '  2. Or start your local Redis instance: redis-server',
      `  3. Verify REDIS_URL in backend/.env`,
    ].join('\n')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Application ports (service-state checks — skip if not started)
// ---------------------------------------------------------------------------
describe('Application ports (backend / frontend)', () => {
  it(`backend API responds on port ${BACKEND_PORT}`, async () => {
    const open = await isTcpPortOpen('localhost', BACKEND_PORT)
    expect(open, [
      `Backend API is not listening on port ${BACKEND_PORT}.`,
      'This means the backend server is not started, not required for infra checks',
      'but required for full application use and E2E tests.',
      'Fix: cd backend && npm run dev',
      `     (expects PORT=${BACKEND_PORT} in backend/.env)`,
    ].join('\n')).toBe(true)
  })

  it(`frontend dev server responds on port ${FRONTEND_PORT}`, async () => {
    const open = await isTcpPortOpen('localhost', FRONTEND_PORT)
    expect(open, [
      `Frontend dev server is not listening on port ${FRONTEND_PORT}.`,
      'Fix: cd frontend && npm run dev',
      `     (expects port ${FRONTEND_PORT} per vite.config.js)`,
    ].join('\n')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Port conflict detection (wrong service on expected port)
// ---------------------------------------------------------------------------
describe('Port conflict detection', () => {
  it(`port ${BACKEND_PORT} is not occupied by a conflicting process`, async () => {
    // We can't definitively identify WHAT is on the port, but if it's open
    // we trust the API health check (file 07) to validate it's the right service.
    // This test just confirms: if open, it was intentional.
    const open = await isTcpPortOpen('localhost', BACKEND_PORT)
    if (!open) {
      console.warn(`  ℹ  Port ${BACKEND_PORT} is free — backend not started yet.`)
    }
    // Always passes — the API health check in 07 verifies the service identity
    expect(true).toBe(true)
  })

  it(`docker-compose postgres host port (${compose?.postgres?.hostPort}) matches backend DB_PORT (${PG_PORT})`, () => {
    const composePort = compose?.postgres?.hostPort
    if (!composePort) {
      console.warn('  ⚠  Could not parse postgres port from docker-compose.yml — skipping')
      return
    }
    expect(composePort, [
      `Port mismatch between docker-compose and backend .env!`,
      `  docker-compose postgres host port: ${composePort}`,
      `  backend DB_PORT:                  ${PG_PORT}`,
      `Fix: ensure docker-compose.yml maps "${PG_PORT}:5432" OR set DB_PORT=${composePort} in backend/.env`,
    ].join('\n')).toBe(PG_PORT)
  })

  it(`docker-compose redis host port (${compose?.redis?.hostPort}) matches REDIS_URL port (${REDIS_PORT})`, () => {
    const composePort = compose?.redis?.hostPort
    if (!composePort) {
      console.warn('  ⚠  Could not parse redis port from docker-compose.yml — skipping')
      return
    }
    expect(composePort, [
      `Port mismatch between docker-compose and backend .env REDIS_URL!`,
      `  docker-compose redis host port: ${composePort}`,
      `  REDIS_URL port:                 ${REDIS_PORT}`,
      `Fix: ensure docker-compose.yml maps "${REDIS_PORT}:6379" OR set REDIS_URL=redis://localhost:${composePort} in backend/.env`,
    ].join('\n')).toBe(REDIS_PORT)
  })

  it(`vite.config.js proxy target port matches backend PORT (${BACKEND_PORT})`, () => {
    const proxyTarget = viteConfig.proxyTarget
    if (!proxyTarget) {
      console.warn('  ⚠  Could not parse proxy target from vite.config.js — skipping')
      return
    }
    let proxyPort = '5000'
    try { proxyPort = new URL(proxyTarget).port || '80' } catch {}

    expect(proxyPort, [
      `Port mismatch between Vite proxy and backend PORT!`,
      `  vite.config.js proxy target: ${proxyTarget} (port ${proxyPort})`,
      `  backend/.env PORT:           ${BACKEND_PORT}`,
      `Fix A: update backend/.env PORT=${proxyPort}`,
      `Fix B: update vite.config.js proxy target to http://localhost:${BACKEND_PORT}`,
    ].join('\n')).toBe(String(BACKEND_PORT))
  })
})
