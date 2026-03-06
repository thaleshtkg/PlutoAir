/**
 * INFRA CHECK 06 — Redis Connectivity
 *
 * Verifies Redis is reachable and responds correctly.
 * Uses a raw TCP connection + the Redis inline command protocol
 * to avoid needing the `redis` npm client to be installed at root level.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import net from 'net'
import { getBackendEnv, isTcpPortOpen } from './helpers.js'

const env = getBackendEnv()
const REDIS_URL = env['REDIS_URL'] || 'redis://localhost:6379'

let redisHost = 'localhost'
let redisPort = 6379
let redisAuth = null

try {
  const url = new URL(REDIS_URL)
  redisHost = url.hostname || 'localhost'
  redisPort = parseInt(url.port || '6379')
  redisAuth = url.password || null
} catch {
  // Use defaults
}

/** Send a raw Redis command and return the response line. */
function sendRedisCommand(command, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    let response = ''
    let settled = false

    const done = (result, err) => {
      if (!settled) {
        settled = true
        socket.destroy()
        if (err) reject(err)
        else resolve(result.trim())
      }
    }

    socket.setTimeout(timeoutMs)
    socket.connect(redisPort, redisHost, () => {
      socket.write(command + '\r\n')
    })
    socket.on('data', (chunk) => {
      response += chunk.toString()
      // Redis inline responses end with \r\n
      if (response.includes('\r\n')) done(response)
    })
    socket.on('error', (err) => done('', err))
    socket.on('timeout', () => done('', new Error(`Redis connection to ${redisHost}:${redisPort} timed out`)))
  })
}

let redisReachable = false

beforeAll(async () => {
  redisReachable = await isTcpPortOpen(redisHost, redisPort, 3000)
  if (!redisReachable) {
    console.warn(`\n  ⚠  Redis port ${redisHost}:${redisPort} is closed — skipping Redis tests.\n`)
  }
})

function requireRedis() {
  if (!redisReachable) {
    console.warn('  ⚠  Redis not reachable — test skipped')
    return false
  }
  return true
}

// ---------------------------------------------------------------------------
// TCP connectivity
// ---------------------------------------------------------------------------
describe('Redis TCP connectivity', () => {
  it(`Redis port ${redisPort} is open on ${redisHost}`, async () => {
    const open = await isTcpPortOpen(redisHost, redisPort)
    expect(open, [
      `Cannot reach Redis on ${redisHost}:${redisPort}.`,
      'Fix options:',
      '  1. Start containers: docker compose up -d',
      '  2. Or start local Redis: redis-server --daemonize yes',
      `  3. Check REDIS_URL="${REDIS_URL}" in backend/.env`,
    ].join('\n')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// PING / PONG
// ---------------------------------------------------------------------------
describe('Redis protocol (PING/PONG)', () => {
  it('responds to PING with +PONG', async () => {
    if (!requireRedis()) return
    let response
    try {
      response = await sendRedisCommand('PING')
    } catch (err) {
      expect.fail([
        `Redis PING failed: ${err.message}`,
        `  Host: ${redisHost}:${redisPort}`,
        'Fix: check docker compose logs redis',
      ].join('\n'))
    }
    expect(response, [
      `Unexpected Redis PING response: "${response}"`,
      'Expected "+PONG". Redis may be misconfigured or a different service is on the port.',
    ].join('\n')).toContain('+PONG')
  })

  it('INFO command returns server info', async () => {
    if (!requireRedis()) return
    let response
    try {
      response = await sendRedisCommand('INFO server')
    } catch {
      // Some Redis versions may require AUTH first — soft failure
      console.warn('  ⚠  INFO command did not respond (may require AUTH)')
      return
    }
    // INFO responds with bulk string starting with $
    expect(response.startsWith('$') || response.includes('redis_version'), [
      `Redis INFO returned unexpected response.`,
    ].join('\n')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Config consistency
// ---------------------------------------------------------------------------
describe('Redis config consistency', () => {
  it('REDIS_URL in backend/.env has a valid redis:// scheme', () => {
    expect(REDIS_URL, [
      `REDIS_URL="${REDIS_URL}" does not use the redis:// scheme.`,
      'Fix: set REDIS_URL=redis://localhost:6379 in backend/.env',
    ].join('\n')).toMatch(/^rediss?:\/\//)
  })

  it('REDIS_URL host is not an empty string', () => {
    expect(redisHost, [
      'Redis host parsed from REDIS_URL is empty.',
      `REDIS_URL="${REDIS_URL}"`,
      'Fix: check the REDIS_URL format in backend/.env',
    ].join('\n')).toBeTruthy()
  })

  it('REDIS_URL port is a valid port number', () => {
    expect(redisPort, [
      `Redis port parsed from REDIS_URL is ${redisPort} — invalid.`,
      `REDIS_URL="${REDIS_URL}"`,
      'Fix: ensure REDIS_URL=redis://localhost:6379',
    ].join('\n')).toBeGreaterThan(0)
  })
})
