/**
 * INFRA CHECK 08 — Frontend Dev Server
 *
 * Verifies the Vite dev server is running and serving the React application.
 * Also checks that the frontend→backend proxy is configured correctly.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { isTcpPortOpen, httpGet, parseViteConfig, FRONTEND_DIR, getBackendEnv } from './helpers.js'

const viteConfig = parseViteConfig()
const backendEnv = getBackendEnv()

const FRONTEND_PORT = viteConfig.serverPort ?? 5173
const FRONTEND_BASE = `http://localhost:${FRONTEND_PORT}`
const PROXY_TARGET = viteConfig.proxyTarget
const BACKEND_PORT = parseInt(backendEnv['PORT'] || '5000')

let frontendReachable = false

beforeAll(async () => {
  frontendReachable = await isTcpPortOpen('localhost', FRONTEND_PORT, 3000)
  if (!frontendReachable) {
    console.warn(`\n  ⚠  Frontend port ${FRONTEND_PORT} is closed — skipping frontend tests.`)
    console.warn('     Start the frontend: cd frontend && npm run dev\n')
  }
})

function requireFrontend() {
  if (!frontendReachable) {
    console.warn('  ⚠  Frontend not running — test skipped')
    return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Vite config inspection (static)
// ---------------------------------------------------------------------------
describe('Vite configuration (static checks)', () => {
  it('vite.config.js exists', () => {
    expect(existsSync(join(FRONTEND_DIR, 'vite.config.js')), [
      'vite.config.js not found in frontend/.',
      'Fix: ensure the file was not accidentally deleted. Check: git status',
    ].join('\n')).toBe(true)
  })

  it('server.port is configured as 5173', () => {
    expect(FRONTEND_PORT, [
      `vite.config.js server port is ${FRONTEND_PORT}, but Playwright and the backend CORS_ORIGIN expect 5173.`,
      'Fix: ensure server: { port: 5173 } is set in frontend/vite.config.js',
    ].join('\n')).toBe(5173)
  })

  it('proxy target for /api is defined', () => {
    expect(PROXY_TARGET, [
      'vite.config.js does not have a proxy entry for "/api".',
      'Without this, frontend API calls will fail with CORS errors in dev.',
      'Fix: add to vite.config.js:',
      '  server: { proxy: { "/api": { target: "http://localhost:5000", changeOrigin: true } } }',
    ].join('\n')).toBeTruthy()
  })

  it('proxy target port matches backend PORT', () => {
    if (!PROXY_TARGET) return
    let proxyPort = '5000'
    try { proxyPort = new URL(PROXY_TARGET).port || '80' } catch {}

    expect(proxyPort, [
      `Proxy target "${PROXY_TARGET}" port is ${proxyPort}, but backend PORT=${BACKEND_PORT}.`,
      'Fix A: change the proxy target in vite.config.js to http://localhost:' + BACKEND_PORT,
      'Fix B: change PORT=' + proxyPort + ' in backend/.env',
    ].join('\n')).toBe(String(BACKEND_PORT))
  })
})

// ---------------------------------------------------------------------------
// Dev server reachability
// ---------------------------------------------------------------------------
describe('Frontend dev server (runtime checks)', () => {
  it(`GET ${FRONTEND_BASE}/ returns HTTP 200`, async () => {
    if (!requireFrontend()) return
    const res = await httpGet(`${FRONTEND_BASE}/`)
    expect(res.status, [
      `Frontend root returned ${res.status} (expected 200).`,
      'Fix: cd frontend && npm run dev',
    ].join('\n')).toBe(200)
  })

  it('response content-type is text/html', async () => {
    if (!requireFrontend()) return
    const res = await httpGet(`${FRONTEND_BASE}/`)
    const contentType = res.headers['content-type'] || ''
    expect(contentType, [
      `Expected text/html from frontend root but got "${contentType}".`,
      'The dev server may be serving an error page or wrong content.',
      'Fix: cd frontend && npm run dev  (watch for compilation errors in the terminal)',
    ].join('\n')).toMatch(/text\/html/)
  })

  it('HTML response contains expected React root element', async () => {
    if (!requireFrontend()) return
    const res = await httpGet(`${FRONTEND_BASE}/`)
    expect(res.body, [
      'The HTML response does not contain a root element for React.',
      'Expected to find <div id="root"> in the HTML.',
      'Fix: check frontend/index.html for the <div id="root"></div> element.',
    ].join('\n')).toContain('id="root"')
  })

  it('HTML response includes the Vite script injections', async () => {
    if (!requireFrontend()) return
    const res = await httpGet(`${FRONTEND_BASE}/`)
    // Vite injects a <script type="module"> pointing to /src/main.jsx
    const hasScript = res.body.includes('<script') && res.body.includes('type="module"')
    expect(hasScript, [
      'Vite did not inject the module script — the page may not be loading correctly.',
      'Fix: check frontend/index.html and run: cd frontend && npm run dev',
    ].join('\n')).toBe(true)
  })

  it('frontend serves a 200 for the /login SPA route (no server-side routing needed)', async () => {
    if (!requireFrontend()) return
    // Vite always returns index.html for unknown routes in SPA mode
    const res = await httpGet(`${FRONTEND_BASE}/login`)
    expect(res.status, [
      `GET /login returned ${res.status}.`,
      'In SPA mode, Vite should return index.html for all routes.',
      'This may indicate a Vite config issue.',
    ].join('\n')).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// Source file integrity
// ---------------------------------------------------------------------------
describe('Frontend source files', () => {
  const REQUIRED_SOURCES = [
    'src/main.jsx',
    'src/App.jsx',
    'src/api/client.js',
    'src/api/services.js',
    'src/store/authStore.js',
    'src/store/bookingStore.js',
    'src/pages/LoginPage.jsx',
  ]

  for (const file of REQUIRED_SOURCES) {
    it(`${file} exists`, () => {
      expect(existsSync(join(FRONTEND_DIR, file)), [
        `${file} not found in frontend/`,
        'Fix: ensure the repository was fully cloned. Run: git status',
      ].join('\n')).toBe(true)
    })
  }

  it('frontend/src/api/client.js points to backend via env or correct default', () => {
    const clientPath = join(FRONTEND_DIR, 'src/api/client.js')
    if (!existsSync(clientPath)) return
    const content = readFileSync(clientPath, 'utf-8')
    // Should reference VITE_API_URL env var or localhost:5000
    const hasApiUrl = content.includes('VITE_API_URL') || content.includes('localhost:5000')
    expect(hasApiUrl, [
      'frontend/src/api/client.js does not reference VITE_API_URL or localhost:5000.',
      'The frontend API client may be hardcoded to the wrong URL.',
      'Fix: ensure client.js uses import.meta.env.VITE_API_URL as the base URL.',
    ].join('\n')).toBe(true)
  })
})
