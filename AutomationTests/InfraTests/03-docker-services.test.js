/**
 * INFRA CHECK 03 — Docker Service Health
 *
 * Verifies that the PostgreSQL and Redis containers defined in docker-compose.yml
 * are present, running, and in a healthy state.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import {
  isDockerAvailable,
  isDockerRunning,
  getContainerInfo,
  parseDockerCompose,
  getDockerComposeCmd,
  tryExec,
  ROOT,
} from './helpers.js'

const compose = parseDockerCompose()
const PG_CONTAINER = compose?.postgres?.containerName ?? 'flight-booking-db'
const REDIS_CONTAINER = compose?.redis?.containerName ?? 'flight-booking-redis'

// ---------------------------------------------------------------------------
// Precondition — skip all if Docker is not available/running
// ---------------------------------------------------------------------------
let dockerReady = false
beforeAll(() => {
  dockerReady = isDockerAvailable() && isDockerRunning()
  if (!dockerReady) {
    console.warn('\n  ⚠  Docker is not available or not running — skipping docker service checks.\n')
  }
})

function requireDocker() {
  if (!dockerReady) {
    console.warn('  ⚠  Docker not running — test skipped')
    return false
  }
  return true
}

// ---------------------------------------------------------------------------
// docker-compose.yml parsing
// ---------------------------------------------------------------------------
describe('docker-compose.yml', () => {
  it('file is parseable and contains postgres service', () => {
    expect(compose, [
      'docker-compose.yml could not be parsed or was not found.',
      'Fix: ensure docker-compose.yml exists at the project root.',
    ].join('\n')).not.toBeNull()
    expect(compose?.postgres, [
      'No postgres service found in docker-compose.yml.',
      'Fix: ensure the docker-compose.yml has not been modified incorrectly.',
    ].join('\n')).toBeDefined()
  })

  it('file contains redis service', () => {
    expect(compose?.redis, [
      'No redis service found in docker-compose.yml.',
      'Fix: ensure the docker-compose.yml has not been modified incorrectly.',
    ].join('\n')).toBeDefined()
  })

  it('postgres exposes port 5432', () => {
    const hostPort = compose?.postgres?.hostPort
    expect(hostPort, [
      `PostgreSQL host port is "${hostPort}" but expected 5432.`,
      'Fix: ensure docker-compose.yml maps "5432:5432" for the postgres service.',
    ].join('\n')).toBe(5432)
  })

  it('redis exposes port 6379', () => {
    const hostPort = compose?.redis?.hostPort
    expect(hostPort, [
      `Redis host port is "${hostPort}" but expected 6379.`,
      'Fix: ensure docker-compose.yml maps "6379:6379" for the redis service.',
    ].join('\n')).toBe(6379)
  })
})

// ---------------------------------------------------------------------------
// PostgreSQL container
// ---------------------------------------------------------------------------
describe(`PostgreSQL container (${PG_CONTAINER})`, () => {
  it('container exists', () => {
    if (!requireDocker()) return
    const info = getContainerInfo(PG_CONTAINER)
    expect(info, [
      `Container "${PG_CONTAINER}" does not exist.`,
      'Fix: start the containers from the project root:',
      '     docker compose up -d',
      `     (or: docker-compose up -d)`,
    ].join('\n')).not.toBeNull()
  })

  it('container is running (State.Status = "running")', () => {
    if (!requireDocker()) return
    const info = getContainerInfo(PG_CONTAINER)
    if (!info) {
      console.warn(`  ⚠  Container ${PG_CONTAINER} not found — skipping status check`)
      return
    }
    const status = info.State?.Status
    expect(status, [
      `Container "${PG_CONTAINER}" is "${status}" (expected "running").`,
      'Fix: docker compose up -d',
      `     or restart: docker compose restart ${PG_CONTAINER}`,
    ].join('\n')).toBe('running')
  })

  it('container health is "healthy" (healthcheck passed)', () => {
    if (!requireDocker()) return
    const info = getContainerInfo(PG_CONTAINER)
    if (!info) return
    const health = info.State?.Health?.Status
    // Only assert if healthcheck is configured; some stripped images skip it
    if (!health) {
      console.warn('  ⚠  No healthcheck configured — skipping health assertion')
      return
    }
    expect(health, [
      `Container "${PG_CONTAINER}" health is "${health}" (expected "healthy").`,
      'PostgreSQL may still be initialising. Wait a few seconds and try again.',
      'Fix: docker compose ps  (check the Health column)',
      '     docker compose logs postgres  (check for errors)',
    ].join('\n')).toBe('healthy')
  })

  it('container port 5432 is mapped to host', () => {
    if (!requireDocker()) return
    const info = getContainerInfo(PG_CONTAINER)
    if (!info) return
    const ports = info.NetworkSettings?.Ports ?? {}
    const mapped = ports['5432/tcp']
    expect(Array.isArray(mapped) && mapped.length > 0, [
      `Container "${PG_CONTAINER}" does not expose port 5432 to the host.`,
      'Fix: ensure docker-compose.yml has "- 5432:5432" under the postgres ports section.',
    ].join('\n')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Redis container
// ---------------------------------------------------------------------------
describe(`Redis container (${REDIS_CONTAINER})`, () => {
  it('container exists', () => {
    if (!requireDocker()) return
    const info = getContainerInfo(REDIS_CONTAINER)
    expect(info, [
      `Container "${REDIS_CONTAINER}" does not exist.`,
      'Fix: docker compose up -d',
    ].join('\n')).not.toBeNull()
  })

  it('container is running', () => {
    if (!requireDocker()) return
    const info = getContainerInfo(REDIS_CONTAINER)
    if (!info) return
    const status = info.State?.Status
    expect(status, [
      `Container "${REDIS_CONTAINER}" is "${status}" (expected "running").`,
      `Fix: docker compose restart ${REDIS_CONTAINER}`,
    ].join('\n')).toBe('running')
  })

  it('container health is "healthy"', () => {
    if (!requireDocker()) return
    const info = getContainerInfo(REDIS_CONTAINER)
    if (!info) return
    const health = info.State?.Health?.Status
    if (!health) {
      console.warn('  ⚠  No healthcheck configured — skipping health assertion')
      return
    }
    expect(health, [
      `Container "${REDIS_CONTAINER}" health is "${health}" (expected "healthy").`,
      'Fix: docker compose logs redis  (check for errors)',
      '     docker compose restart redis',
    ].join('\n')).toBe('healthy')
  })

  it('container port 6379 is mapped to host', () => {
    if (!requireDocker()) return
    const info = getContainerInfo(REDIS_CONTAINER)
    if (!info) return
    const ports = info.NetworkSettings?.Ports ?? {}
    const mapped = ports['6379/tcp']
    expect(Array.isArray(mapped) && mapped.length > 0, [
      `Container "${REDIS_CONTAINER}" does not expose port 6379 to the host.`,
      'Fix: ensure docker-compose.yml has "- 6379:6379" under the redis ports.',
    ].join('\n')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Compose project overall
// ---------------------------------------------------------------------------
describe('Docker Compose project', () => {
  it('compose config is valid (docker compose config exits 0)', () => {
    if (!requireDocker()) return
    const cmd = getDockerComposeCmd()
    if (!cmd) return
    const out = tryExec(`${cmd} -f "${ROOT}/docker-compose.yml" config --quiet`)
    expect(out !== null, [
      '"docker compose config" failed — your docker-compose.yml has syntax errors.',
      'Fix: validate the file with: docker compose config',
    ].join('\n')).toBe(true)
  })
})
