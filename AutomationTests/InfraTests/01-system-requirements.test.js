/**
 * INFRA CHECK 01 — System Requirements
 *
 * Validates that all CLI tools needed to run and operate PlutoAir are installed
 * and meet minimum version requirements.
 *
 * FIX GUIDE embedded in each test's error message.
 */

import { existsSync } from 'fs'
import { describe, it, expect } from 'vitest'
import {
  tryExec,
  isDockerAvailable,
  isDockerRunning,
  isDockerComposeAvailable,
  ROOT,
  BACKEND_DIR,
  FRONTEND_DIR,
} from './helpers.js'

// ---------------------------------------------------------------------------
// Node.js
// ---------------------------------------------------------------------------
describe('Node.js', () => {
  it('is installed and meets minimum version (v18+)', () => {
    const version = process.version // e.g. "v20.11.0"
    const major = parseInt(version.replace('v', '').split('.')[0])
    expect(major, [
      `Node.js ${version} is below the required minimum v18.`,
      `Fix: install Node.js 18 LTS or later from https://nodejs.org`,
      `     or use nvm: nvm install 18 && nvm use 18`,
    ].join('\n')).toBeGreaterThanOrEqual(18)
  })

  it('has a working "node" executable in PATH', () => {
    const out = tryExec('node --version')
    expect(out, [
      '"node" command not found in PATH.',
      'Fix: make sure Node.js is installed and its bin directory is in your PATH.',
    ].join('\n')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// npm
// ---------------------------------------------------------------------------
describe('npm', () => {
  it('is installed and meets minimum version (v9+)', () => {
    const out = tryExec('npm --version')
    expect(out, [
      '"npm" not found. Install Node.js (npm is bundled with it).',
    ].join('\n')).not.toBeNull()

    const major = parseInt(out.split('.')[0])
    expect(major, [
      `npm ${out} is below the required minimum v9.`,
      `Fix: npm install -g npm@latest`,
    ].join('\n')).toBeGreaterThanOrEqual(9)
  })
})

// ---------------------------------------------------------------------------
// Docker CLI
// ---------------------------------------------------------------------------
describe('Docker CLI', () => {
  it('docker is installed', () => {
    expect(isDockerAvailable(), [
      '"docker" command not found.',
      'Fix: install Docker Desktop from https://www.docker.com/products/docker-desktop/',
      '     or Docker Engine (Linux): https://docs.docker.com/engine/install/',
    ].join('\n')).toBe(true)
  })

  it('docker daemon is running', () => {
    if (!isDockerAvailable()) {
      console.warn('  ⚠  Skipping — Docker CLI not installed')
      return
    }
    expect(isDockerRunning(), [
      'Docker daemon is not running.',
      'Fix (Windows/Mac): open Docker Desktop application.',
      'Fix (Linux):       sudo systemctl start docker',
    ].join('\n')).toBe(true)
  })

  it('docker version output is parseable (server is reachable)', () => {
    if (!isDockerAvailable() || !isDockerRunning()) return
    const out = tryExec('docker version --format "{{.Server.Version}}"')
    expect(out, [
      'Cannot read Docker server version — daemon may be unreachable.',
      'Fix: start Docker Desktop or run: sudo systemctl start docker',
    ].join('\n')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Docker Compose
// ---------------------------------------------------------------------------
describe('Docker Compose', () => {
  it('docker compose (V2) or docker-compose (V1) is available', () => {
    expect(isDockerComposeAvailable(), [
      'Neither "docker compose" (V2) nor "docker-compose" (V1) is available.',
      'Fix: upgrade Docker Desktop (ships with Compose V2 since v4.x)',
      '     or install plugin: https://docs.docker.com/compose/install/',
    ].join('\n')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Project files on disk
// ---------------------------------------------------------------------------
describe('Required project files', () => {
  it('docker-compose.yml exists at the project root', () => {
    expect(existsSync(`${ROOT}/docker-compose.yml`), [
      'docker-compose.yml not found at the project root.',
      'Fix: ensure you cloned the full repository and are running from the project root.',
    ].join('\n')).toBe(true)
  })

  it('backend/package.json exists', () => {
    expect(existsSync(`${BACKEND_DIR}/package.json`), [
      'backend/package.json not found.',
      'Fix: ensure the repository was fully cloned. Run: git status',
    ].join('\n')).toBe(true)
  })

  it('frontend/package.json exists', () => {
    expect(existsSync(`${FRONTEND_DIR}/package.json`), [
      'frontend/package.json not found.',
      'Fix: ensure the repository was fully cloned. Run: git status',
    ].join('\n')).toBe(true)
  })

  it('backend/node_modules exists (npm install was run)', () => {
    expect(existsSync(`${BACKEND_DIR}/node_modules`), [
      'backend/node_modules not found — npm install was not run.',
      'Fix: cd backend && npm install',
    ].join('\n')).toBe(true)
  })

  it('frontend/node_modules exists (npm install was run)', () => {
    expect(existsSync(`${FRONTEND_DIR}/node_modules`), [
      'frontend/node_modules not found — npm install was not run.',
      'Fix: cd frontend && npm install',
    ].join('\n')).toBe(true)
  })

  it('backend/src/app.js exists (entry point)', () => {
    expect(existsSync(`${BACKEND_DIR}/src/app.js`), [
      'backend/src/app.js not found — the backend entry point is missing.',
      'Fix: ensure the full repository was cloned correctly.',
    ].join('\n')).toBe(true)
  })

  it('backend/knexfile.js exists (DB config)', () => {
    expect(existsSync(`${BACKEND_DIR}/knexfile.js`), [
      'backend/knexfile.js not found — database configuration is missing.',
      'Fix: ensure the full repository was cloned correctly.',
    ].join('\n')).toBe(true)
  })
})
