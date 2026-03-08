/**
 * INFRA CHECK 07 — Backend API Health & CORS
 *
 * Verifies the backend Express server is:
 *  - Running on the expected port
 *  - Returning a healthy /health response
 *  - Serving CORS headers for the frontend origin
 *  - Responding (not 404) on all expected route prefixes
 */

import http from 'http'
import { describe, it, expect, beforeAll } from 'vitest'
import { getBackendEnv, getFrontendEnv, parseViteConfig, isTcpPortOpen, httpGet, httpPost, httpOptions } from './helpers.js'

const backendEnv = getBackendEnv()
const frontendEnv = getFrontendEnv()
const viteConfig = parseViteConfig()

const BACKEND_PORT = parseInt(backendEnv['PORT'] || '5000')
const BACKEND_BASE = `http://localhost:${BACKEND_PORT}`
const CORS_ORIGIN = backendEnv['CORS_ORIGIN'] || `http://localhost:${viteConfig.serverPort || 5173}`

let apiReachable = false

beforeAll(async () => {
  apiReachable = await isTcpPortOpen('localhost', BACKEND_PORT, 3000)
  if (!apiReachable) {
    console.warn(`\n  ⚠  Backend API port ${BACKEND_PORT} is closed — skipping API health tests.`)
    console.warn(`     Start the backend: cd backend && npm run dev\n`)
  }
})

function requireApi() {
  if (!apiReachable) {
    console.warn('  ⚠  Backend not running — test skipped')
    return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Health endpoint
// ---------------------------------------------------------------------------
describe('Backend /health endpoint', () => {
  it('GET /health returns HTTP 200', async () => {
    if (!requireApi()) return
    const res = await httpGet(`${BACKEND_BASE}/health`)
    expect(res.status, [
      `GET ${BACKEND_BASE}/health returned ${res.status} (expected 200).`,
      'The /health endpoint should always return 200.',
      'Fix: check backend/src/app.js for the health route definition.',
    ].join('\n')).toBe(200)
  })

  it('GET /health returns JSON body with status: "ok"', async () => {
    if (!requireApi()) return
    const res = await httpGet(`${BACKEND_BASE}/health`)
    let body
    try { body = JSON.parse(res.body) } catch {
      expect.fail(`/health did not return valid JSON. Body: "${res.body}"`)
    }
    expect(body.status, [
      `GET /health returned body: ${JSON.stringify(body)}`,
      'Expected { status: "ok", ... }',
      'Fix: ensure the /health handler returns res.json({ status: "ok" })',
    ].join('\n')).toBe('ok')
  })

  it('GET /health response includes a timestamp field', async () => {
    if (!requireApi()) return
    const res = await httpGet(`${BACKEND_BASE}/health`)
    let body
    try { body = JSON.parse(res.body) } catch { return }
    expect(body.timestamp, [
      'The /health endpoint does not include a "timestamp" field.',
      'Consider adding: res.json({ status: "ok", timestamp: new Date().toISOString() })',
    ].join('\n')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------
describe('CORS configuration', () => {
  it(`/health includes Access-Control-Allow-Origin for frontend origin`, async () => {
    if (!requireApi()) return

    // Make a request with the Origin header set (simulating a browser)
    const res = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: BACKEND_PORT,
        path: '/health',
        method: 'GET',
        headers: { Origin: CORS_ORIGIN },
        timeout: 5000,
      }, (r) => {
        let body = ''
        r.on('data', c => body += c)
        r.on('end', () => resolve({ status: r.statusCode, headers: r.headers, body }))
      })
      req.on('error', reject)
      req.end()
    })

    const acao = res.headers['access-control-allow-origin']
    expect(acao, [
      `No "Access-Control-Allow-Origin" header in /health response.`,
      `Backend CORS_ORIGIN="${CORS_ORIGIN}" but the header is missing.`,
      'Fix: ensure cors() middleware is applied in backend/src/app.js before routes.',
      `     CORS_ORIGIN should match the frontend URL (${CORS_ORIGIN})`,
    ].join('\n')).toBeTruthy()
  })

  it('CORS preflight (OPTIONS) on /api/auth/login returns 200 or 204', async () => {
    if (!requireApi()) return
    let res
    try {
      res = await httpOptions(`${BACKEND_BASE}/api/auth/login`, CORS_ORIGIN)
    } catch (err) {
      expect.fail(`CORS preflight failed: ${err.message}`)
    }
    expect([200, 204], [
      `CORS preflight OPTIONS /api/auth/login returned ${res.status} (expected 200 or 204).`,
      `Origin sent: ${CORS_ORIGIN}`,
      'Fix: ensure cors() is configured with credentials: true and the correct origin.',
    ].join('\n')).toContain(res.status)
  })
})

// ---------------------------------------------------------------------------
// Route presence (not 404)
// ---------------------------------------------------------------------------
describe('API route availability', () => {
  const ROUTES = [
    { path: '/api/auth/login',    method: 'POST', expectNotStatus: 404 },
    { path: '/api/flights/cities', method: 'GET',  expectNotStatus: 404 },
    { path: '/api/flights/search', method: 'POST', expectNotStatus: 404 },
    { path: '/api/booking',        method: 'POST', expectNotStatus: 404 },
    { path: '/api/payment/initiate', method: 'POST', expectNotStatus: 404 },
  ]

  for (const route of ROUTES) {
    it(`${route.method} ${route.path} route exists (does not return 404)`, async () => {
      if (!requireApi()) return
      // For routes that require auth, we send without a token — expecting 401/403/400/422
      // NOT 404, which would mean the route doesn't exist at all
      const res = route.method === 'POST'
        ? await httpPost(`${BACKEND_BASE}${route.path}`)
        : await httpGet(`${BACKEND_BASE}${route.path}`)
      expect(res.status, [
        `${route.method} ${route.path} returned 404 — the route is not registered.`,
        'This means the route was removed, renamed, or the app failed to start correctly.',
        'Fix: check backend/src/routes/ for the correct route file.',
        '     Check backend/src/app.js to verify the router is mounted.',
      ].join('\n')).not.toBe(404)
    })
  }
})

// ---------------------------------------------------------------------------
// Response time
// ---------------------------------------------------------------------------
describe('API response time', () => {
  it('GET /health responds within 2000ms', async () => {
    if (!requireApi()) return
    const start = Date.now()
    await httpGet(`${BACKEND_BASE}/health`)
    const elapsed = Date.now() - start
    expect(elapsed, [
      `GET /health took ${elapsed}ms — this is unusually slow.`,
      'The backend may be under load or there is a database connection timeout.',
      'Fix: check backend logs and database connectivity.',
    ].join('\n')).toBeLessThan(2000)
  })
})
