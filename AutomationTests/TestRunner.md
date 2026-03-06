# PlutoAir — Test Runner Guide

All tests live under `AutomationTests/` and are wired through a single
master runner script plus individual npm scripts. You can run everything at
once, pick a category, or drill down to a single stage.

---

## Prerequisites

| Requirement | Minimum version |
|---|---|
| Node.js | 18 |
| npm | 9 |
| Docker + Docker Compose | any recent |

```bash
# Install all dependencies from the project root
npm install
cd backend  && npm install && cd ..
cd frontend && npm install && cd ..
```

---

## Quick-start (run everything)

All commands below are run from the **project root** (`c:\Projects\PlutoAir`).

```bash
# Run all 16 stages in order, print summary at the end
npm run test:all

# Same but stop the moment any stage fails
npm run test:all:stop

# Skip infra pre-flights, run backend + frontend + browser tests
npm run test:all:skip-infra

# Fastest — skip infra and Playwright (unit + integration only)
npm run test:all:quick
```

---

## Stage map

The master runner divides every test into 16 numbered stages across 4 groups.

| # | Group | Stage |
|---|---|---|
| 1 | Infrastructure | System Requirements |
| 2 | Infrastructure | Environment Config |
| 3 | Infrastructure | Docker Services |
| 4 | Infrastructure | Port Connectivity |
| 5 | Infrastructure | Database Connectivity |
| 6 | Infrastructure | Redis Connectivity |
| 7 | Infrastructure | API Health |
| 8 | Infrastructure | Frontend Dev Server |
| 9 | Infrastructure | Cross-Service Consistency |
| 10 | Backend | Unit Tests |
| 11 | Backend | Integration Tests (Mocked DB) |
| 12 | Backend | E2E API Tests (Mocked DB) |
| 13 | Frontend | Unit Tests |
| 14 | Frontend | Component Integration Tests |
| 15 | Frontend | Page Integration Tests |
| 16 | Browser E2E | Playwright Tests |

---

## Run specific stages with `--stages`

Pass a comma-separated list of stage numbers to the runner directly:

```bash
# Run only stages 1 and 2 (system + env checks)
node AutomationTests/run-all-tests.js --stages 1,2

# Run all infra checks, stop on first failure
node AutomationTests/run-all-tests.js --stages 1,2,3,4,5,6,7,8,9 --stop-on-failure

# Run only backend tests (unit + integration + e2e api)
node AutomationTests/run-all-tests.js --stages 10,11,12

# Run only frontend tests
node AutomationTests/run-all-tests.js --stages 13,14,15

# Run only Playwright browser tests
node AutomationTests/run-all-tests.js --stages 16
```

---

## Run by category (npm scripts)

### Infrastructure pre-flights

> Run these first on a new machine or server to diagnose environment issues
> before starting any other tests.

```bash
# All 9 infra checks in one go
npm run test:infra

# Individual checks
npm run test:infra:system       # Node, npm, Docker versions + required files
npm run test:infra:env          # .env exists, variables complete and valid
npm run test:infra:docker       # Containers defined, running, healthy
npm run test:infra:ports        # All service ports reachable via TCP
npm run test:infra:db           # DB connection, migrations applied, tables exist
npm run test:infra:redis        # Redis TCP open, responds to PING
npm run test:infra:api          # /health endpoint returns 200, CORS headers OK
npm run test:infra:frontend     # Dev-server port open, returns valid HTML
npm run test:infra:consistency  # Port/URL cross-checks across all config files
```

### Backend tests

> Run from the **project root** — npm will `cd backend` automatically.

```bash
# Unit tests only (no DB required)
cd backend && npm run test:unit

# Integration tests — mocked DB (no real DB required)
cd backend && npm run test:integration

# E2E API tests — mocked DB (no real DB required)
cd backend && npm run test:e2e:api

# All backend tests (prepares test DB, then runs unit + integration + e2e:api)
cd backend && npm test
```

### Frontend tests

> Run from the **project root** — npm will `cd frontend` automatically.

```bash
# Unit tests — pure utility functions and Zustand stores
cd frontend && npm run test:unit

# Component integration tests — React component rendering + interaction
cd frontend && npm run test:components

# Page integration tests — full page render, forms, navigation
cd frontend && npm run test:pages

# All frontend tests in one command
cd frontend && npm test

# Run in watch mode (re-runs on file save — useful during development)
cd frontend && npm run test:watch

# Generate HTML coverage report (opens in browser)
cd frontend && npm run test:coverage
```

### Browser E2E (Playwright)

> Requires the frontend dev server **and** backend to be running.

```bash
# Run all Playwright specs
npm run test:e2e:browser

# Run Playwright with the interactive UI mode
npx playwright test --ui

# Run a single spec file
npx playwright test AutomationTests/E2ETests/Browser/homepage.spec.js

# Run in headed mode (shows the browser window)
npx playwright test --headed

# View the last HTML report
npx playwright show-report
```

---

## Combining flags

The runner flags can be combined freely:

```bash
# Skip infra + browser, stop on first failure
node AutomationTests/run-all-tests.js --skip-infra --skip-browser --stop-on-failure

# Run only backend and frontend unit tests, stop on failure
node AutomationTests/run-all-tests.js --stages 10,13 --stop-on-failure

# Run all infra + all backend, skip browser E2E
node AutomationTests/run-all-tests.js --skip-browser --stages 1,2,3,4,5,6,7,8,9,10,11,12
```

---

## Folder structure

```
AutomationTests/
├── run-all-tests.js              ← master runner (this is what npm run test:all calls)
├── TestRunner.md                 ← this guide
│
├── UnitTests/
│   ├── Backend/                  ← pure function / middleware unit tests
│   └── Frontend/                 ← utility function + Zustand store tests
│
├── IntegrationTests/
│   ├── Backend/
│   │   ├── Mocked/               ← Express routes with mocked DB layer
│   │   └── RealDB/               ← routes tested against a real test database
│   └── Frontend/
│       ├── Components/           ← React component tests (render + interaction)
│       └── Pages/                ← full page tests (forms, navigation, API mocks)
│
├── E2ETests/
│   ├── API/
│   │   ├── Mocked/               ← full HTTP chain via Supertest, mocked DB
│   │   └── RealDB/               ← full HTTP chain against a real test database
│   └── Browser/                  ← Playwright specs (real browser)
│
├── InfraTests/                   ← 9 pre-flight validation test files + helpers.js
│   ├── helpers.js
│   ├── 01-system-requirements.test.js
│   ├── 02-environment-config.test.js
│   ├── 03-docker-services.test.js
│   ├── 04-port-connectivity.test.js
│   ├── 05-database-connectivity.test.js
│   ├── 06-redis-connectivity.test.js
│   ├── 07-api-health.test.js
│   ├── 08-frontend-server.test.js
│   └── 09-cross-service-consistency.test.js
│
└── helpers/
    └── testDb.js                 ← shared DB helpers for RealDB tests
```

---

## What each infra failure means

| Stage | Failure message contains | Typical fix |
|---|---|---|
| 1 — System | Node version too low | `nvm use 18` or install Node 18+ |
| 1 — System | Docker not found | Install Docker Desktop |
| 2 — Env | `.env` missing | `cp backend/.env.example backend/.env` then fill values |
| 2 — Env | Variable still placeholder | Edit `backend/.env`, replace `changeme` / `your_secret_here` |
| 3 — Docker | Daemon not running | Start Docker Desktop |
| 3 — Docker | Container not running | `docker compose up -d` |
| 4 — Ports | Port X not open | Check the service for that port is started |
| 5 — DB | Connection refused | `docker compose up -d postgres` |
| 5 — DB | Migrations not run | `cd backend && npm run migrate` |
| 6 — Redis | Connection refused | `docker compose up -d redis` |
| 7 — API | Connection refused | `cd backend && npm run dev` |
| 8 — Frontend | Connection refused | `cd frontend && npm run dev` |
| 9 — Consistency | Port mismatch | Align `VITE_API_URL`, `PORT`, `CORS_ORIGIN` in `backend/.env` |

---

## Recommended test order on a fresh server

```bash
# 1. Verify the environment is ready
npm run test:infra

# 2. Run tests that need no running services
cd backend  && npm run test:unit     && cd ..
cd frontend && npm run test:unit     && cd ..

# 3. Start services, then run integration tests
docker compose up -d
cd backend  && npm run test:integration && cd ..
cd frontend && npm run test:components  && cd ..
cd frontend && npm run test:pages       && cd ..

# 4. Full E2E (services must be running)
cd backend && npm run test:e2e:api && cd ..
npm run test:e2e:browser

# — or just run everything at once —
npm run test:all
```
