/**
 * INFRA CHECK 09 — Full Cross-Service Configuration Consistency
 *
 * This file is the "integration test" of the configuration layer:
 * it checks that all configuration files agree with each other.
 *
 * Common causes of migration failures this catches:
 *  - Copied .env from another machine with different ports
 *  - Updated docker-compose.yml but forgot to update .env
 *  - Backend PORT changed but vite.config.js proxy not updated
 *  - CORS_ORIGIN doesn't match where the frontend actually runs
 *  - DB credentials in .env don't match docker-compose environment block
 *  - Payment redirect URL points to wrong host/port
 *  - Playwright baseURL doesn't match Vite server port
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { ROOT, BACKEND_DIR, FRONTEND_DIR, getBackendEnv, getFrontendEnv, parseViteConfig, parseDockerCompose } from './helpers.js'

const backendEnv = getBackendEnv()
const frontendEnv = getFrontendEnv()
const viteConfig = parseViteConfig()
const compose = parseDockerCompose()

// Derived values
const BACKEND_PORT = backendEnv['PORT'] || '5000'
const FRONTEND_PORT = String(viteConfig.serverPort ?? 5173)
const DB_PORT = backendEnv['DB_PORT'] || '5432'
const DB_HOST = backendEnv['DB_HOST'] || 'localhost'
const DB_USER = backendEnv['DB_USER'] || ''
const DB_PASSWORD = backendEnv['DB_PASSWORD'] || ''
const DB_NAME = backendEnv['DB_NAME'] || ''

function parsePort(url) {
  try { return new URL(url).port || null } catch { return null }
}

// ---------------------------------------------------------------------------
// Backend ↔ Frontend proxy
// ---------------------------------------------------------------------------
describe('Backend ↔ Frontend proxy alignment', () => {
  it('vite.config.js proxy target port === backend PORT', () => {
    const proxyTarget = viteConfig.proxyTarget
    if (!proxyTarget) {
      console.warn('  ⚠  Proxy target not found in vite.config.js — skipping')
      return
    }
    const proxyPort = parsePort(proxyTarget) || '80'
    expect(proxyPort, [
      `MISMATCH: Vite proxy target uses port ${proxyPort}, but backend PORT=${BACKEND_PORT}`,
      '',
      'When this differs, browser API calls (/api/*) will be proxied to the wrong host.',
      `File: frontend/vite.config.js  → proxy target: "${proxyTarget}"`,
      `File: backend/.env             → PORT=${BACKEND_PORT}`,
      '',
      `Fix: change proxy target to http://localhost:${BACKEND_PORT}`,
      `     OR change backend PORT to ${proxyPort}`,
    ].join('\n')).toBe(BACKEND_PORT)
  })

  it('backend CORS_ORIGIN port === vite.config.js server port', () => {
    const corsOrigin = backendEnv['CORS_ORIGIN'] || ''
    const corsPort = parsePort(corsOrigin) || '80'
    expect(corsPort, [
      `MISMATCH: backend CORS_ORIGIN uses port ${corsPort}, but Vite runs on port ${FRONTEND_PORT}`,
      '',
      'When this differs, browser cross-origin requests will be rejected with CORS errors.',
      `File: backend/.env          → CORS_ORIGIN="${corsOrigin}"`,
      `File: frontend/vite.config.js → server.port=${FRONTEND_PORT}`,
      '',
      `Fix: set CORS_ORIGIN=http://localhost:${FRONTEND_PORT} in backend/.env`,
    ].join('\n')).toBe(FRONTEND_PORT)
  })

  it('VITE_API_URL port === backend PORT', () => {
    const apiUrl = frontendEnv['VITE_API_URL'] || ''
    if (!apiUrl) return
    const apiPort = parsePort(apiUrl) || '80'
    expect(apiPort, [
      `MISMATCH: VITE_API_URL uses port ${apiPort}, but backend PORT=${BACKEND_PORT}`,
      '',
      `File: frontend/.env  → VITE_API_URL="${apiUrl}"`,
      `File: backend/.env   → PORT=${BACKEND_PORT}`,
      '',
      `Fix: set VITE_API_URL=http://localhost:${BACKEND_PORT} in frontend/.env`,
    ].join('\n')).toBe(BACKEND_PORT)
  })
})

// ---------------------------------------------------------------------------
// Backend ↔ Docker Compose
// ---------------------------------------------------------------------------
describe('backend/.env ↔ docker-compose.yml alignment', () => {
  it('DB_PORT matches postgres host port in docker-compose', () => {
    const composePort = compose?.postgres?.hostPort
    if (!composePort) {
      console.warn('  ⚠  Could not parse postgres port from docker-compose.yml')
      return
    }
    expect(String(composePort), [
      `MISMATCH: docker-compose maps postgres to host port ${composePort}, but backend DB_PORT=${DB_PORT}`,
      '',
      'PostgreSQL will be unreachable with these mismatched settings.',
      `File: docker-compose.yml → postgres ports: "${composePort}:5432"`,
      `File: backend/.env       → DB_PORT=${DB_PORT}`,
      '',
      `Fix A: change docker-compose to "${DB_PORT}:5432" and re-run: docker compose up -d`,
      `Fix B: change DB_PORT=${composePort} in backend/.env`,
    ].join('\n')).toBe(DB_PORT)
  })

  it('DB_USER matches POSTGRES_USER in docker-compose', () => {
    const composeUser = compose?.postgres?.user
    if (!composeUser) return
    expect(composeUser, [
      `MISMATCH: docker-compose POSTGRES_USER="${composeUser}", but backend DB_USER="${DB_USER}"`,
      '',
      'Authentication will fail — PostgreSQL will reject the connection.',
      '',
      `Fix: align DB_USER in backend/.env with POSTGRES_USER in docker-compose.yml`,
    ].join('\n')).toBe(DB_USER)
  })

  it('DB_PASSWORD matches POSTGRES_PASSWORD in docker-compose', () => {
    const composePass = compose?.postgres?.password
    if (!composePass) return
    expect(composePass, [
      `MISMATCH: docker-compose POSTGRES_PASSWORD does not match backend DB_PASSWORD`,
      '',
      'Authentication will fail — PostgreSQL will reject the connection.',
      '',
      'Fix: align DB_PASSWORD in backend/.env with POSTGRES_PASSWORD in docker-compose.yml',
    ].join('\n')).toBe(DB_PASSWORD)
  })

  it('DB_NAME matches POSTGRES_DB in docker-compose', () => {
    const composeDb = compose?.postgres?.database
    if (!composeDb) return
    expect(composeDb, [
      `MISMATCH: docker-compose POSTGRES_DB="${composeDb}", but backend DB_NAME="${DB_NAME}"`,
      '',
      'The backend will connect to the right server but the wrong database.',
      '',
      `Fix: align DB_NAME in backend/.env with POSTGRES_DB in docker-compose.yml`,
    ].join('\n')).toBe(DB_NAME)
  })

  it('REDIS_URL host matches Redis container host (localhost for Docker Desktop)', () => {
    let redisHost = 'localhost'
    try { redisHost = new URL(backendEnv['REDIS_URL'] || '').hostname } catch {}
    // On Docker Desktop (Mac/Win) containers are on localhost
    // On Linux you may use 127.0.0.1 which is equivalent
    const validHosts = ['localhost', '127.0.0.1']
    expect(validHosts, [
      `REDIS_URL host is "${redisHost}".`,
      'If running Docker on Linux with host networking, use "localhost" or "127.0.0.1".',
      'If using Docker Desktop, always use "localhost".',
      `Fix: set REDIS_URL=redis://localhost:6379 in backend/.env`,
    ].join('\n')).toContain(redisHost)
  })
})

// ---------------------------------------------------------------------------
// Payment redirect URL
// ---------------------------------------------------------------------------
describe('Payment redirect URL consistency', () => {
  it('PAYMENT_REDIRECT_URL uses same host/port as backend', () => {
    const redirectUrl = backendEnv['PAYMENT_REDIRECT_URL'] || ''
    if (!redirectUrl) return
    const redirectPort = parsePort(redirectUrl) || '80'
    expect(redirectPort, [
      `MISMATCH: PAYMENT_REDIRECT_URL uses port ${redirectPort}, but backend PORT=${BACKEND_PORT}`,
      '',
      'The dummy bank redirect will return to the wrong server.',
      `Current: PAYMENT_REDIRECT_URL="${redirectUrl}"`,
      '',
      `Fix: set PAYMENT_REDIRECT_URL=http://localhost:${BACKEND_PORT}/payment/dummy-bank`,
    ].join('\n')).toBe(BACKEND_PORT)
  })
})

// ---------------------------------------------------------------------------
// Playwright config consistency
// ---------------------------------------------------------------------------
describe('Playwright config consistency', () => {
  it('playwright.config.js baseURL matches frontend port', () => {
    const pwConfigPath = join(ROOT, 'playwright.config.js')
    if (!existsSync(pwConfigPath)) {
      console.warn('  ⚠  playwright.config.js not found — skipping')
      return
    }
    const content = readFileSync(pwConfigPath, 'utf-8')
    const baseUrlMatch = content.match(/baseURL\s*:\s*['"]([^'"]+)['"]/)
    if (!baseUrlMatch) {
      console.warn('  ⚠  Could not parse baseURL from playwright.config.js')
      return
    }
    const baseUrl = baseUrlMatch[1]
    const pwPort = parsePort(baseUrl) || '80'
    expect(pwPort, [
      `MISMATCH: playwright.config.js baseURL="${baseUrl}" (port ${pwPort}), but Vite runs on ${FRONTEND_PORT}`,
      '',
      'E2E tests will fail to connect to the frontend.',
      '',
      `Fix: set baseURL: 'http://localhost:${FRONTEND_PORT}' in playwright.config.js`,
    ].join('\n')).toBe(FRONTEND_PORT)
  })

  it('playwright webServer.url (if set) matches the frontend dev server port', () => {
    const pwConfigPath = join(ROOT, 'playwright.config.js')
    if (!existsSync(pwConfigPath)) return
    const content = readFileSync(pwConfigPath, 'utf-8')
    // The webServer.url is polled to know when the dev server is ready —
    // for a frontend SPA it should point to the Vite server, not the backend.
    const webServerUrlMatch = content.match(/url\s*:\s*['"]http:\/\/localhost:(\d+)['"]/)
    if (!webServerUrlMatch) return // no webServer configured
    const wsPort = webServerUrlMatch[1]
    expect(wsPort, [
      `playwright.config.js webServer.url uses port ${wsPort}, but Vite runs on ${FRONTEND_PORT}`,
      'The webServer.url should point at the frontend dev server so Playwright waits for it.',
      `Fix: set url: 'http://localhost:${FRONTEND_PORT}' in the playwright.config.js webServer block`,
    ].join('\n')).toBe(FRONTEND_PORT)
  })
})

// ---------------------------------------------------------------------------
// .env completeness against .env.example
// ---------------------------------------------------------------------------
describe('Environment variable completeness', () => {
  it('backend/.env has no extra undefined placeholder values', () => {
    // Check for obvious unfilled template values
    const placeholders = Object.entries(backendEnv).filter(([, v]) =>
      v === 'your_value_here' || v === 'CHANGE_ME' || v === 'TODO' || v === '<fill_in>'
    )
    expect(placeholders, [
      `backend/.env contains unfilled placeholder values:`,
      placeholders.map(([k, v]) => `  ${k}=${v}`).join('\n'),
      'Fix: replace placeholder values with actual configuration.',
    ].join('\n')).toHaveLength(0)
  })

  it('frontend env has no unfilled placeholder values', () => {
    const placeholders = Object.entries(frontendEnv).filter(([, v]) =>
      v === 'your_value_here' || v === 'CHANGE_ME' || v === 'TODO'
    )
    expect(placeholders, [
      `frontend/.env contains unfilled placeholder values:`,
      placeholders.map(([k, v]) => `  ${k}=${v}`).join('\n'),
      'Fix: replace placeholder values in frontend/.env',
    ].join('\n')).toHaveLength(0)
  })
})
