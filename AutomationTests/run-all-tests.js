#!/usr/bin/env node
/**
 * AutomationTests/run-all-tests.js
 *
 * Master test runner — executes every test suite stage by stage.
 * Run from the project root:
 *
 *   node AutomationTests/run-all-tests.js
 *
 * Options:
 *   --stop-on-failure   Abort the moment any stage fails
 *   --skip-infra        Skip all 9 infrastructure pre-flight checks
 *   --skip-browser      Skip Playwright browser E2E tests
 *   --stages <list>     Run only the listed stage numbers  (e.g. --stages 1,2,10,13)
 *
 * Stage map:
 *   1  Infra — System Requirements        10  Backend — Unit Tests
 *   2  Infra — Environment Config         11  Backend — Integration (Mocked DB)
 *   3  Infra — Docker Services            12  Backend — E2E API (Mocked DB)
 *   4  Infra — Port Connectivity          13  Frontend — Unit Tests
 *   5  Infra — Database Connectivity      14  Frontend — Component Tests
 *   6  Infra — Redis Connectivity         15  Frontend — Page Tests
 *   7  Infra — API Health                 16  Browser  — Playwright E2E
 *   8  Infra — Frontend Dev Server
 *   9  Infra — Cross-Service Consistency
 */

import { spawnSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')

// ─── Platform helpers ─────────────────────────────────────────────────────────
const isWindows = process.platform === 'win32'
const npm       = isWindows ? 'npm.cmd' : 'npm'

// ─── ANSI colours (auto-disabled when not a TTY) ─────────────────────────────
const tty = process.stdout.isTTY
const c = {
  reset  : tty ? '\x1b[0m'  : '',
  bold   : tty ? '\x1b[1m'  : '',
  dim    : tty ? '\x1b[2m'  : '',
  green  : tty ? '\x1b[32m' : '',
  red    : tty ? '\x1b[31m' : '',
  yellow : tty ? '\x1b[33m' : '',
  cyan   : tty ? '\x1b[36m' : '',
  white  : tty ? '\x1b[97m' : '',
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
const LINE = '═'.repeat(64)
const line = '─'.repeat(64)

function banner(text) {
  console.log(`\n${c.cyan}${LINE}${c.reset}`)
  console.log(`${c.bold}${c.white}  ${text}${c.reset}`)
  console.log(`${c.cyan}${LINE}${c.reset}`)
}

function sectionHeader(stageNum, total, name) {
  console.log(`\n${c.yellow}${line}${c.reset}`)
  console.log(`${c.bold}  Stage ${stageNum}/${total}  —  ${name}${c.reset}`)
  console.log(`${c.yellow}${line}${c.reset}`)
}

// ─── Stage runner ─────────────────────────────────────────────────────────────
function runStage(label, args, cwd = ROOT) {
  console.log(`${c.dim}  ▶  ${npm} ${args.join(' ')}${c.reset}`)
  console.log(`${c.dim}     cwd: ${cwd}${c.reset}\n`)

  const result = spawnSync(npm, args, {
    cwd,
    stdio : 'inherit',
    shell : false,
    env   : { ...process.env },
  })

  const passed = result.status === 0
  console.log(
    passed
      ? `\n${c.green}  ✅  PASSED: ${label}${c.reset}`
      : `\n${c.red}  ❌  FAILED: ${label}  (exit ${result.status ?? 'signal:' + result.signal})${c.reset}`,
  )
  return passed
}

// ─── Stage definitions ────────────────────────────────────────────────────────
const BACKEND  = resolve(ROOT, 'backend')
const FRONTEND = resolve(ROOT, 'frontend')

const ALL_STAGES = [
  // ── Infrastructure pre-flight ──────────────────────────────────────────────
  {
    id    : 1,
    group : 'Infrastructure',
    name  : 'System Requirements',
    exec  : () => runStage('Infra — System Requirements',  ['run', 'test:infra:system']),
  },
  {
    id    : 2,
    group : 'Infrastructure',
    name  : 'Environment Config',
    exec  : () => runStage('Infra — Environment Config',   ['run', 'test:infra:env']),
  },
  {
    id    : 3,
    group : 'Infrastructure',
    name  : 'Docker Services',
    exec  : () => runStage('Infra — Docker Services',      ['run', 'test:infra:docker']),
  },
  {
    id    : 4,
    group : 'Infrastructure',
    name  : 'Port Connectivity',
    exec  : () => runStage('Infra — Port Connectivity',    ['run', 'test:infra:ports']),
  },
  {
    id    : 5,
    group : 'Infrastructure',
    name  : 'Database Connectivity',
    exec  : () => runStage('Infra — Database Connectivity',['run', 'test:infra:db']),
  },
  {
    id    : 6,
    group : 'Infrastructure',
    name  : 'Redis Connectivity',
    exec  : () => runStage('Infra — Redis Connectivity',   ['run', 'test:infra:redis']),
  },
  {
    id    : 7,
    group : 'Infrastructure',
    name  : 'API Health',
    exec  : () => runStage('Infra — API Health',           ['run', 'test:infra:api']),
  },
  {
    id    : 8,
    group : 'Infrastructure',
    name  : 'Frontend Dev Server',
    exec  : () => runStage('Infra — Frontend Dev Server',  ['run', 'test:infra:frontend']),
  },
  {
    id    : 9,
    group : 'Infrastructure',
    name  : 'Cross-Service Consistency',
    exec  : () => runStage('Infra — Cross-Service Consistency', ['run', 'test:infra:consistency']),
  },

  // ── Backend ────────────────────────────────────────────────────────────────
  {
    id    : 10,
    group : 'Backend',
    name  : 'Unit Tests',
    exec  : () => runStage('Backend — Unit Tests',                     ['run', 'test:unit'],        BACKEND),
  },
  {
    id    : 11,
    group : 'Backend',
    name  : 'Integration Tests (Mocked DB)',
    exec  : () => runStage('Backend — Integration (Mocked DB)',        ['run', 'test:integration'], BACKEND),
  },
  {
    id    : 12,
    group : 'Backend',
    name  : 'E2E API Tests (Mocked DB)',
    exec  : () => runStage('Backend — E2E API (Mocked DB)',            ['run', 'test:e2e:api'],     BACKEND),
  },

  // ── Frontend ───────────────────────────────────────────────────────────────
  {
    id    : 13,
    group : 'Frontend',
    name  : 'Unit Tests',
    exec  : () => runStage('Frontend — Unit Tests',                    ['run', 'test:unit'],        FRONTEND),
  },
  {
    id    : 14,
    group : 'Frontend',
    name  : 'Component Integration Tests',
    exec  : () => runStage('Frontend — Component Integration',         ['run', 'test:components'],  FRONTEND),
  },
  {
    id    : 15,
    group : 'Frontend',
    name  : 'Page Integration Tests',
    exec  : () => runStage('Frontend — Page Integration',              ['run', 'test:pages'],       FRONTEND),
  },

  // ── Browser E2E ───────────────────────────────────────────────────────────
  {
    id    : 16,
    group : 'Browser E2E',
    name  : 'Playwright Tests',
    exec  : () => runStage('Browser E2E — Playwright',                 ['run', 'test:e2e:browser']),
  },
]

// ─── CLI parsing ──────────────────────────────────────────────────────────────
const argv         = process.argv.slice(2)
const stopOnFail   = argv.includes('--stop-on-failure')
const skipInfra    = argv.includes('--skip-infra')
const skipBrowser  = argv.includes('--skip-browser')

let stageFilter = null
const stagesFlag = argv.indexOf('--stages')
if (stagesFlag !== -1 && argv[stagesFlag + 1]) {
  stageFilter = argv[stagesFlag + 1].split(',').map(Number)
}

let queue = [...ALL_STAGES]
if (skipInfra)   queue = queue.filter(s => s.group !== 'Infrastructure')
if (skipBrowser) queue = queue.filter(s => s.group !== 'Browser E2E')
if (stageFilter) queue = queue.filter(s => stageFilter.includes(s.id))

// ─── Main ─────────────────────────────────────────────────────────────────────
banner('PlutoAir — Full Automated Test Suite')
console.log(`  Started  : ${new Date().toLocaleString()}`)
console.log(`  Stages   : ${queue.map(s => s.id).join(', ')}  (${queue.length} total)`)
console.log(`  Options  : stop-on-failure=${stopOnFail}  skip-infra=${skipInfra}  skip-browser=${skipBrowser}`)

const results = []
const suiteStart = Date.now()

for (const stage of queue) {
  sectionHeader(stage.id, ALL_STAGES.at(-1).id, `${stage.group}  ›  ${stage.name}`)

  const stageStart = Date.now()
  const passed     = stage.exec()
  const elapsed    = ((Date.now() - stageStart) / 1000).toFixed(1)

  results.push({ id: stage.id, group: stage.group, name: stage.name, passed, elapsed })

  if (!passed && stopOnFail) {
    console.log(`\n${c.red}  ⛔  --stop-on-failure set — aborting remaining stages.${c.reset}`)
    break
  }
}

// ─── Summary table ────────────────────────────────────────────────────────────
banner('FINAL SUMMARY')

const maxGroup = Math.max(...results.map(r => r.group.length))
const maxName  = Math.max(...results.map(r => r.name.length))

const header = [
  ' #'.padStart(3),
  'Group'.padEnd(maxGroup),
  'Stage'.padEnd(maxName),
  'Result  ',
  'Time',
].join('  ')

console.log(`  ${c.bold}${header}${c.reset}`)
console.log(`  ${line}`)

for (const r of results) {
  const status = r.passed
    ? `${c.green}✅ PASS${c.reset}`
    : `${c.red}❌ FAIL${c.reset}`

  console.log(
    `  ${String(r.id).padStart(2)}  ` +
    `${r.group.padEnd(maxGroup)}  ` +
    `${r.name.padEnd(maxName)}  ` +
    `${status}  ` +
    `${r.elapsed}s`,
  )
}

const passed      = results.filter(r => r.passed).length
const failed      = results.filter(r => !r.passed).length
const skipped     = ALL_STAGES.length - results.length
const totalElapsed = ((Date.now() - suiteStart) / 1000).toFixed(1)

console.log(`\n  ${line}`)
console.log(
  `  ${c.green}Passed: ${passed}${c.reset}` +
  `   ${failed > 0 ? c.red : ''}Failed: ${failed}${c.reset}` +
  `   ${c.dim}Skipped: ${skipped}${c.reset}` +
  `   Total time: ${totalElapsed}s`,
)

if (failed > 0) {
  console.log(`\n  ${c.red}${c.bold}Failing stages:${c.reset}`)
  results
    .filter(r => !r.passed)
    .forEach(r => console.log(`    • Stage ${r.id}: ${r.group} › ${r.name}`))
}

console.log()
process.exit(failed > 0 ? 1 : 0)
