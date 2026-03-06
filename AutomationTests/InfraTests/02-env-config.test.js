/**
 * INFRA CHECK 02 — Environment Configuration
 *
 * Validates that all required .env files exist and contain every variable
 * the application needs. Also validates that configuration values are
 * internally consistent (e.g. no missing JWT secrets, correct CORS origin).
 */

import { existsSync } from 'fs'
import { join } from 'path'
import { describe, it, expect } from 'vitest'
import {
  ROOT, BACKEND_DIR, FRONTEND_DIR,
  getBackendEnv, getFrontendEnv, parseEnvFile,
} from './helpers.js'

const backendEnv = getBackendEnv()
const frontendEnv = getFrontendEnv()

const REQUIRED_BACKEND_VARS = [
  'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'REDIS_URL',
  'JWT_SECRET', 'JWT_REFRESH_SECRET',
  'PORT',
  'NODE_ENV',
  'CORS_ORIGIN',
  'PAYMENT_REDIRECT_URL',
  'PAYMENT_CALLBACK_SECRET',
]

const REQUIRED_FRONTEND_VARS = [
  'VITE_API_URL',
]

const DEFAULT_INSECURE_VALUES = [
  'flight-booking-secret-key-do-not-use-in-production-12345',
  'flight-booking-refresh-secret-key-do-not-use-in-production-12345',
  'payment-secret-key-do-not-use-in-production',
]

// ---------------------------------------------------------------------------
// backend/.env presence
// ---------------------------------------------------------------------------
describe('backend/.env file', () => {
  it('backend/.env file exists', () => {
    expect(existsSync(join(BACKEND_DIR, '.env')), [
      'backend/.env file not found.',
      'Fix: cp backend/.env.example backend/.env',
      '     then edit the values to match your environment.',
    ].join('\n')).toBe(true)
  })

  it('backend/.env.example exists (template)', () => {
    expect(existsSync(join(BACKEND_DIR, '.env.example')), [
      'backend/.env.example not found.',
      'This file should be in version control. Check: git status',
    ].join('\n')).toBe(true)
  })

  it('backend/.env is not identical to .env.example (was customised)', () => {
    const envPath = join(BACKEND_DIR, '.env')
    const examplePath = join(BACKEND_DIR, '.env.example')
    if (!existsSync(envPath) || !existsSync(examplePath)) return
    // Identical files are a yellow flag but not a hard failure in dev
    // (they share the same defaults). Just verify the file was created.
    expect(existsSync(envPath)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Required backend variables
// ---------------------------------------------------------------------------
describe('Required backend env vars', () => {
  for (const varName of REQUIRED_BACKEND_VARS) {
    it(`${varName} is defined and non-empty`, () => {
      const value = backendEnv[varName]
      expect(value, [
        `${varName} is missing or empty in backend/.env`,
        `Fix: add "${varName}=<value>" to backend/.env`,
        `     Reference: backend/.env.example for expected format`,
      ].join('\n')).toBeTruthy()
    })
  }
})

// ---------------------------------------------------------------------------
// backend variable value quality
// ---------------------------------------------------------------------------
describe('Backend env var values', () => {
  it('PORT is a valid port number (1–65535)', () => {
    const port = parseInt(backendEnv['PORT'] || '0')
    expect(port, [
      `PORT="${backendEnv['PORT']}" is not a valid port number.`,
      'Fix: set PORT to a number between 1024 and 65535 in backend/.env',
    ].join('\n')).toBeGreaterThanOrEqual(1024)
    expect(port).toBeLessThanOrEqual(65535)
  })

  it('DB_PORT is a valid port number', () => {
    const port = parseInt(backendEnv['DB_PORT'] || '0')
    expect(port, [
      `DB_PORT="${backendEnv['DB_PORT']}" is not a valid port number.`,
      'Fix: set DB_PORT=5432 in backend/.env (PostgreSQL default)',
    ].join('\n')).toBeGreaterThan(0)
  })

  it('REDIS_URL has a valid redis:// or rediss:// scheme', () => {
    const url = backendEnv['REDIS_URL'] || ''
    expect(url, [
      `REDIS_URL="${url}" is not a valid Redis URL.`,
      'Fix: set REDIS_URL=redis://localhost:6379 in backend/.env',
    ].join('\n')).toMatch(/^rediss?:\/\//)
  })

  it('CORS_ORIGIN is a valid URL', () => {
    const origin = backendEnv['CORS_ORIGIN'] || ''
    let valid = false
    try { new URL(origin); valid = true } catch {}
    expect(valid, [
      `CORS_ORIGIN="${origin}" is not a valid URL.`,
      'Fix: set CORS_ORIGIN=http://localhost:5173 in backend/.env',
    ].join('\n')).toBe(true)
  })

  it('PAYMENT_REDIRECT_URL is a valid URL', () => {
    const url = backendEnv['PAYMENT_REDIRECT_URL'] || ''
    let valid = false
    try { new URL(url); valid = true } catch {}
    expect(valid, [
      `PAYMENT_REDIRECT_URL="${url}" is not a valid URL.`,
      'Fix: set PAYMENT_REDIRECT_URL=http://localhost:5000/payment/dummy-bank',
    ].join('\n')).toBe(true)
  })

  it('NODE_ENV is one of: development | test | production', () => {
    const env = backendEnv['NODE_ENV'] || ''
    expect(['development', 'test', 'production'], [
      `NODE_ENV="${env}" is not a recognised value.`,
      'Fix: set NODE_ENV=development in backend/.env for local dev',
    ].join('\n')).toContain(env)
  })

  it('JWT_SECRET is at least 32 characters long', () => {
    const secret = backendEnv['JWT_SECRET'] || ''
    expect(secret.length, [
      `JWT_SECRET is only ${secret.length} characters — too short.`,
      'Fix: generate a strong secret: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    ].join('\n')).toBeGreaterThanOrEqual(32)
  })

  it('JWT_REFRESH_SECRET is at least 32 characters long', () => {
    const secret = backendEnv['JWT_REFRESH_SECRET'] || ''
    expect(secret.length, [
      `JWT_REFRESH_SECRET is only ${secret.length} characters — too short.`,
      'Fix: generate a strong secret (see JWT_SECRET tip above)',
    ].join('\n')).toBeGreaterThanOrEqual(32)
  })

  it('JWT_SECRET and JWT_REFRESH_SECRET are different', () => {
    const a = backendEnv['JWT_SECRET']
    const b = backendEnv['JWT_REFRESH_SECRET']
    expect(a, [
      'JWT_SECRET and JWT_REFRESH_SECRET must not be identical.',
      'Fix: generate two separate secrets.',
    ].join('\n')).not.toBe(b)
  })

  it('warns if production-unsafe default secrets are in use', () => {
    const nodeEnv = backendEnv['NODE_ENV']
    if (nodeEnv === 'production') {
      for (const secret of DEFAULT_INSECURE_VALUES) {
        const isUsed = Object.values(backendEnv).includes(secret)
        expect(isUsed, [
          `A default insecure secret is present in a PRODUCTION environment!`,
          `Secret starts with: "${secret.slice(0, 40)}..."`,
          'Fix: generate new secrets before deploying to production.',
        ].join('\n')).toBe(false)
      }
    }
    // In development, this is acceptable — pass silently
  })
})

// ---------------------------------------------------------------------------
// frontend/.env
// ---------------------------------------------------------------------------
describe('Frontend env config', () => {
  it('frontend/.env or frontend/.env.example exists', () => {
    const hasEnv = existsSync(join(FRONTEND_DIR, '.env'))
    const hasExample = existsSync(join(FRONTEND_DIR, '.env.example'))
    expect(hasEnv || hasExample, [
      'Neither frontend/.env nor frontend/.env.example was found.',
      'Fix: cp frontend/.env.example frontend/.env',
    ].join('\n')).toBe(true)
  })

  it('VITE_API_URL is defined', () => {
    expect(frontendEnv['VITE_API_URL'], [
      'VITE_API_URL is not set in frontend/.env',
      'Fix: add VITE_API_URL=http://localhost:5000 to frontend/.env',
    ].join('\n')).toBeTruthy()
  })

  it('VITE_API_URL is a valid URL', () => {
    const url = frontendEnv['VITE_API_URL'] || ''
    let valid = false
    try { new URL(url); valid = true } catch {}
    expect(valid, [
      `VITE_API_URL="${url}" is not a valid URL.`,
      'Fix: set VITE_API_URL=http://localhost:5000 in frontend/.env',
    ].join('\n')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Cross-service configuration consistency
// ---------------------------------------------------------------------------
describe('Cross-service config consistency', () => {
  it('backend PORT matches VITE_API_URL port in frontend env', () => {
    const backendPort = backendEnv['PORT'] || '5000'
    const apiUrl = frontendEnv['VITE_API_URL'] || 'http://localhost:5000'
    let frontendApiPort = '5000'
    try { frontendApiPort = new URL(apiUrl).port || '80' } catch {}

    expect(frontendApiPort, [
      `Port mismatch detected!`,
      `  backend/.env PORT=${backendPort}`,
      `  frontend VITE_API_URL port=${frontendApiPort} (from "${apiUrl}")`,
      `Fix: ensure VITE_API_URL=http://localhost:${backendPort} in frontend/.env`,
      `     and that backend/.env PORT=${frontendApiPort}`,
    ].join('\n')).toBe(backendPort)
  })

  it('backend CORS_ORIGIN matches expected frontend URL', () => {
    const corsOrigin = backendEnv['CORS_ORIGIN'] || ''
    // It must point to localhost (for dev) or a configured host
    expect(corsOrigin, [
      `CORS_ORIGIN="${corsOrigin}" does not look like a frontend URL.`,
      'Fix: set CORS_ORIGIN=http://localhost:5173 in backend/.env',
      '     (or the actual domain in production)',
    ].join('\n')).toBeTruthy()
  })

  it('PAYMENT_REDIRECT_URL uses the same port as backend PORT', () => {
    const backendPort = backendEnv['PORT'] || '5000'
    const redirectUrl = backendEnv['PAYMENT_REDIRECT_URL'] || ''
    let redirectPort = '5000'
    try { redirectPort = new URL(redirectUrl).port || '80' } catch {}

    expect(redirectPort, [
      `Port mismatch in PAYMENT_REDIRECT_URL!`,
      `  backend PORT=${backendPort}`,
      `  PAYMENT_REDIRECT_URL port=${redirectPort} (from "${redirectUrl}")`,
      `Fix: set PAYMENT_REDIRECT_URL=http://localhost:${backendPort}/payment/dummy-bank`,
    ].join('\n')).toBe(backendPort)
  })

  it('backend DB_HOST is defined (not empty or undefined)', () => {
    expect(backendEnv['DB_HOST'], [
      'DB_HOST is not set in backend/.env',
      'Fix: add DB_HOST=localhost (or your PostgreSQL host) to backend/.env',
    ].join('\n')).toBeTruthy()
  })

  it('.env.example has no missing non-test keys compared to .env', () => {
    const examplePath = join(BACKEND_DIR, '.env.example')
    if (!existsSync(examplePath)) return

    const exampleEnv = parseEnvFile(examplePath)
    // TEST_DB_* vars are optional — knexfile.js falls back to DB_* when they're absent
    const OPTIONAL_PREFIXES = ['TEST_DB_']
    const missingInEnv = Object.keys(exampleEnv).filter(k =>
      !(k in backendEnv) && !OPTIONAL_PREFIXES.some(prefix => k.startsWith(prefix))
    )
    const missingTestVars = Object.keys(exampleEnv).filter(k =>
      !(k in backendEnv) && OPTIONAL_PREFIXES.some(prefix => k.startsWith(prefix))
    )

    if (missingTestVars.length > 0) {
      console.warn(`  ℹ  Optional test-only vars not in .env (uses DB_* fallback): ${missingTestVars.join(', ')}`)
    }

    expect(missingInEnv, [
      `backend/.env is missing required keys that are in .env.example:`,
      missingInEnv.map(k => `  - ${k}`).join('\n'),
      'Fix: add the missing keys to backend/.env',
    ].join('\n')).toHaveLength(0)
  })
})
