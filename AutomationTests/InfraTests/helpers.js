/**
 * Shared utilities for all infra validation tests.
 * Uses only Node.js built-ins + dotenv so it works anywhere.
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import net from 'net'
import http from 'http'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const ROOT = resolve(__dirname, '../..')
export const BACKEND_DIR = join(ROOT, 'backend')
export const FRONTEND_DIR = join(ROOT, 'frontend')

// ---------------------------------------------------------------------------
// .env helpers
// ---------------------------------------------------------------------------

/** Parse a .env file into a plain object (no external dependency). */
export function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  const content = readFileSync(filePath, 'utf-8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    env[key] = val
  }
  return env
}

export function getBackendEnv() {
  return parseEnvFile(join(BACKEND_DIR, '.env'))
}

export function getFrontendEnv() {
  // Frontend may not have a .env — that's OK, fall back to .env.example
  const envPath = join(FRONTEND_DIR, '.env')
  const examplePath = join(FRONTEND_DIR, '.env.example')
  if (existsSync(envPath)) return parseEnvFile(envPath)
  if (existsSync(examplePath)) return parseEnvFile(examplePath)
  return {}
}

// ---------------------------------------------------------------------------
// Shell helpers
// ---------------------------------------------------------------------------

/** Run a command and return stdout, or null if it fails. */
export function tryExec(cmd) {
  try {
    return execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'], timeout: 8000 })
      .toString()
      .trim()
  } catch {
    return null
  }
}

/** Run a command and return { stdout, exitCode }. */
export function runCmd(cmd) {
  try {
    const stdout = execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'], timeout: 10000 }).toString().trim()
    return { stdout, exitCode: 0 }
  } catch (err) {
    return { stdout: '', stderr: err.stderr?.toString() || '', exitCode: err.status ?? 1 }
  }
}

// ---------------------------------------------------------------------------
// Network helpers
// ---------------------------------------------------------------------------

/** Check if a TCP port is open (accepts connections). Resolves true/false. */
export function isTcpPortOpen(host, port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let settled = false

    const done = (result) => {
      if (!settled) {
        settled = true
        socket.destroy()
        resolve(result)
      }
    }

    socket.setTimeout(timeoutMs)
    socket.once('connect', () => done(true))
    socket.once('error', () => done(false))
    socket.once('timeout', () => done(false))
    socket.connect(port, host)
  })
}

/** Check if a TCP port is CLOSED (not listening). Resolves true if free. */
export function isTcpPortFree(host, port) {
  return isTcpPortOpen(host, port).then(open => !open)
}

/** Make an HTTP GET request. Returns { status, headers, body } or throws. */
export function httpGet(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error(`HTTP GET ${url} timed out after ${timeoutMs}ms`)) })
  })
}

/** Make an HTTP POST request with an empty JSON body. */
export function httpPost(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: 'POST',
      timeout: timeoutMs,
      headers: { 'Content-Type': 'application/json', 'Content-Length': 2 },
    }
    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error(`HTTP POST ${url} timed out after ${timeoutMs}ms`)) })
    req.write('{}')
    req.end()
  })
}

/** Make an HTTP OPTIONS (CORS preflight) request. */
export function httpOptions(url, origin, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: 'OPTIONS',
      timeout: timeoutMs,
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
      },
    }
    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error(`OPTIONS ${url} timed out`)) })
    req.end()
  })
}

// ---------------------------------------------------------------------------
// Docker helpers
// ---------------------------------------------------------------------------

export function isDockerAvailable() {
  return tryExec('docker --version') !== null
}

export function isDockerRunning() {
  return tryExec('docker info --format "{{.ServerVersion}}"') !== null
}

export function isDockerComposeAvailable() {
  // Docker Compose V2 is `docker compose`, V1 is `docker-compose`
  const v2 = tryExec('docker compose version')
  const v1 = tryExec('docker-compose --version')
  return v2 !== null || v1 !== null
}

export function getDockerComposeCmd() {
  if (tryExec('docker compose version') !== null) return 'docker compose'
  if (tryExec('docker-compose --version') !== null) return 'docker-compose'
  return null
}

/** Get container info from `docker inspect`. Returns parsed JSON or null. */
export function getContainerInfo(name) {
  const out = tryExec(`docker inspect ${name}`)
  if (!out) return null
  try {
    const arr = JSON.parse(out)
    return arr[0] || null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// vite.config.js parser (minimal regex — avoids importing Vite)
// ---------------------------------------------------------------------------

export function parseViteConfig() {
  const configPath = join(FRONTEND_DIR, 'vite.config.js')
  if (!existsSync(configPath)) return {}
  const content = readFileSync(configPath, 'utf-8')

  const portMatch = content.match(/server\s*:\s*\{[^}]*port\s*:\s*(\d+)/s)
  const proxyTargetMatch = content.match(/proxy\s*:\s*\{[^}]*['"]\/api['"]\s*:\s*\{[^}]*target\s*:\s*['"]([^'"]+)['"]/s)

  return {
    serverPort: portMatch ? parseInt(portMatch[1]) : 5173,
    proxyTarget: proxyTargetMatch ? proxyTargetMatch[1] : null,
  }
}

// ---------------------------------------------------------------------------
// docker-compose.yml parser (minimal YAML regex)
// ---------------------------------------------------------------------------

export function parseDockerCompose() {
  const composePath = join(ROOT, 'docker-compose.yml')
  if (!existsSync(composePath)) return null
  const content = readFileSync(composePath, 'utf-8')

  // Extract port mappings like "5432:5432"
  const pgPortMatch = content.match(/postgres[\s\S]*?ports:[\s\S]*?-\s*["']?(\d+):(\d+)["']?/m)
  const redisPortMatch = content.match(/redis[\s\S]*?ports:[\s\S]*?-\s*["']?(\d+):(\d+)["']?/m)

  // Extract postgres env vars
  const pgUserMatch = content.match(/POSTGRES_USER\s*:\s*(\S+)/)
  const pgPassMatch = content.match(/POSTGRES_PASSWORD\s*:\s*(\S+)/)
  const pgDbMatch = content.match(/POSTGRES_DB\s*:\s*(\S+)/)

  // Extract container names
  const pgContainerMatch = content.match(/container_name\s*:\s*(flight-booking-db)/)
  const redisContainerMatch = content.match(/container_name\s*:\s*(flight-booking-redis)/)

  return {
    postgres: {
      hostPort: pgPortMatch ? parseInt(pgPortMatch[1]) : null,
      containerPort: pgPortMatch ? parseInt(pgPortMatch[2]) : null,
      user: pgUserMatch ? pgUserMatch[1] : null,
      password: pgPassMatch ? pgPassMatch[1] : null,
      database: pgDbMatch ? pgDbMatch[1] : null,
      containerName: pgContainerMatch ? pgContainerMatch[1] : 'flight-booking-db',
    },
    redis: {
      hostPort: redisPortMatch ? parseInt(redisPortMatch[1]) : null,
      containerPort: redisPortMatch ? parseInt(redisPortMatch[2]) : null,
      containerName: redisContainerMatch ? redisContainerMatch[1] : 'flight-booking-redis',
    },
  }
}
