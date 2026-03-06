# Reusable Prompt — Full Test Audit, Setup & Organisation

> Copy the block below and paste it as-is into any AI assistant (Cursor, Copilot, Claude, etc.)
> to apply the same end-to-end test workflow to another project.
> Replace "PlutoAir" with your project name wherever it appears.

---

```
You are an expert software QA engineer and full-stack developer.
I need you to perform a complete test audit, gap-fill, restructure, and
documentation pass for this project. Work through every phase below in
order. Do not skip any phase. After completing each phase, summarise what
was done before moving to the next.

════════════════════════════════════════════════════════════════
PHASE 1 — AUDIT EXISTING TESTS
════════════════════════════════════════════════════════════════
1. Explore the entire repository and find every existing test file
   (any file matching *.test.*, *.spec.*, or living inside folders
   named tests/, __tests__, spec/, e2e/, etc.).

2. For each test file found, identify:
   - Which module/layer it covers (backend, frontend, API, DB, browser)
   - What testing category it belongs to:
       Unit          → tests a single function/class in isolation
       Integration   → tests multiple modules wired together (mocked DB)
       Integration-RealDB → same but using a real database
       E2E-API       → full HTTP request/response chain via Supertest/etc.
       E2E-Browser   → real browser automation (Playwright/Cypress/etc.)
       Infrastructure → validates environment pre-requisites
   - Which testing framework is used (Jest, Vitest, Mocha, Playwright, etc.)
   - Whether the test file is referenced in any npm/package script

3. List every module in the project (backend routes, frontend pages,
   frontend components, Zustand/Redux stores, utility functions, etc.)
   that has NO test coverage at all.

4. Produce a gap table:
   Module | Existing test category | Missing categories | Priority
   Sort by priority: High = no tests at all, Medium = partial coverage.

════════════════════════════════════════════════════════════════
PHASE 2 — ADD MISSING FRONTEND TESTS
════════════════════════════════════════════════════════════════
(If a frontend module exists — React, Vue, Angular, Svelte, etc.)

1. Check the frontend package.json for any existing test framework.
   If none exists, install the appropriate stack for the framework:
   - React → vitest + @testing-library/react + @testing-library/user-event
             + @testing-library/jest-dom + jsdom + msw
   - Vue   → vitest + @testing-library/vue + jsdom
   - Other → choose the idiomatic testing stack for that framework.
   Add a vitest.config.js (or jest.config.js) configured for:
   - environment: jsdom
   - globals: true
   - setupFiles pointing to a test/setup file
   - coverage provider: v8
   Add "test", "test:unit", "test:components", "test:pages",
   "test:coverage" scripts to frontend/package.json.

2. Extract pure/helper functions from page/component files into
   dedicated src/utils/ modules so they can be unit-tested without
   mounting a component. Create the util files and update the
   original page/component to import from them.

3. Write unit tests for every extracted utility function. Each test file
   must cover: happy path, boundary values, and error/edge cases.

4. Write unit tests for every state management store
   (Zustand, Redux, Pinia, etc.) covering all actions, guards,
   and computed/derived values.

5. Write component tests for every shared/reusable UI component
   (buttons, modals, toast notifications, nav bars, step indicators, etc.).
   Test: renders correctly, interactive behaviour (clicks, inputs),
   accessibility attributes (aria-*, role, labels).

6. Write page integration tests for every page/route component.
   Test: renders with required props, form validation (field-level and
   submit-level), API calls triggered on user action (mock the API layer),
   navigation after success/failure, loading and error states.

7. After writing all tests, run the full frontend test suite and fix
   any failures. Aim for 100% of written tests passing.

════════════════════════════════════════════════════════════════
PHASE 3 — ADD MISSING BACKEND TESTS
════════════════════════════════════════════════════════════════
(If a backend module exists — Node/Express, Django, FastAPI, Rails, etc.)

1. For any backend module with no unit tests, write unit tests covering:
   - Middleware (auth guards, rate limiters, validators, error handlers)
   - Pure utility/helper functions
   - Model methods that contain business logic

2. For any route/controller group with no integration test (mocked DB),
   write integration tests using Supertest or the equivalent:
   - Authentication flows (register, login, refresh, logout)
   - Protected vs public route access
   - Input validation rejection (400 responses)
   - Business logic correctness (correct status codes, response shapes)
   - Mock the database/external service layer with vi.mock/jest.mock.

3. For critical user journeys (e.g., register → login → use feature →
   complete transaction), write a RealDB integration test that uses a
   dedicated test database, wraps each test in a transaction, and rolls
   back after each test. Include a DB setup script (create test DB,
   migrate, seed).

4. For the most critical end-to-end API flow (e.g., the full purchase
   or booking journey), write a RealDB E2E API test using Supertest
   that exercises every API endpoint in sequence.

5. Run all backend tests and fix any failures.

════════════════════════════════════════════════════════════════
PHASE 4 — ADD INFRASTRUCTURE VALIDATION TESTS
════════════════════════════════════════════════════════════════
Create a suite of infrastructure pre-flight validation tests that any
developer can run to diagnose environment issues before running the main
app or the other test suites. Use Vitest (Node environment) or Jest.

Write the following test categories, each as a separate numbered file
(e.g., 01-system-requirements.test.js):

01 — System requirements
    - Node.js is installed and meets the project's minimum version
    - npm/yarn/pnpm is installed and meets minimum version
    - Docker CLI is installed (if Docker is used)
    - Docker daemon is running (if Docker is used)
    - Docker Compose is available
    - All required project config files exist (package.json, docker-compose.yml,
      .env.example, knexfile/DB config, vite.config, etc.)

02 — Environment config
    - backend/.env file exists
    - All required environment variables are defined (compare against .env.example)
    - Critical variables are not still set to placeholder values
      ("your_secret_here", "changeme", etc.)
    - Port values are valid integers in range 1024–65535
    - URL values are valid URLs
    - Cross-service consistency: the port in VITE_API_URL matches the
      backend PORT variable; JWT secrets are defined; DB connection
      strings reference the right host/port

03 — Docker services (if applicable)
    - docker-compose.yml is parseable and defines expected services
    - Required containers (DB, cache, etc.) exist in Docker Compose config
    - Container port mappings match what the .env variables declare
    - Containers are running (State.Status = "running")
    - Containers are healthy (healthcheck passed)

04 — Port connectivity
    - Every service port (DB, cache, backend API, frontend dev server)
      is reachable via TCP on localhost
    - Port numbers are consistent between Docker Compose and .env

05 — Database connectivity
    - Can open a real DB connection using credentials from .env
    - Connected to the expected database name and user
    - Schema migrations table exists (confirms migrations have been run)
    - Expected tables are present
    - Seed data is present (at least one flight/product/admin record exists)

06 — Cache/Redis connectivity (if applicable)
    - Redis TCP port is open
    - Redis responds to PING with PONG
    - REDIS_URL format in .env is valid

07 — API health
    - Backend /health (or equivalent) endpoint returns 200
    - Response body contains expected fields (status, timestamp, etc.)
    - Response time is under an acceptable threshold (e.g., 2 s)
    - CORS headers are present and correct (Access-Control-Allow-Origin)
    - CORS preflight OPTIONS request succeeds

08 — Frontend dev server
    - Frontend config file (vite.config.js / next.config.js / etc.) is parseable
    - The configured dev-server port matches the port in VITE_API_URL or equivalent
    - Frontend dev server is reachable on its port
    - Response contains valid HTML with expected landmarks (<html>, <head>, <body>)

09 — Cross-service configuration consistency
    - Vite proxy target URL matches backend PORT
    - CORS_ORIGIN in backend .env matches the frontend URL
    - Playwright baseURL matches the frontend URL
    - No unfilled placeholder values remain in any config file
    - All port references across all config files are internally consistent

Each test file must:
- Import helpers from a shared helpers.js file (parseEnvFile, tryExec,
  isTcpPortOpen, httpGet, httpOptions, getContainerInfo, parseViteConfig,
  parseDockerCompose)
- Use a beforeAll guard that skips the entire suite gracefully when a
  prerequisite is unavailable (e.g., skip all Docker tests when Docker
  daemon is not running)
- Provide actionable failure messages:
  "Fix: cd backend && npm run dev" or "Fix: docker compose up -d"

Add these scripts to root package.json:
  "test:infra": "vitest run --config vitest.infra.config.js"
  "test:infra:system", "test:infra:env", "test:infra:docker",
  "test:infra:ports", "test:infra:db", "test:infra:redis",
  "test:infra:api", "test:infra:frontend", "test:infra:consistency"

Run the infra suite and fix any test-logic bugs (genuine infra failures
like "Docker not running" are expected and correct — do not mask them).

════════════════════════════════════════════════════════════════
PHASE 5 — MIGRATE ALL TESTS INTO AutomationTests/
════════════════════════════════════════════════════════════════
1. Create a single top-level AutomationTests/ folder with this structure:
   AutomationTests/
   ├── UnitTests/
   │   ├── Backend/         ← backend unit tests
   │   └── Frontend/        ← frontend unit tests (utils + stores)
   ├── IntegrationTests/
   │   ├── Backend/
   │   │   ├── Mocked/      ← mocked-DB backend integration tests
   │   │   └── RealDB/      ← real-DB backend integration tests
   │   └── Frontend/
   │       ├── Components/  ← component integration tests
   │       └── Pages/       ← page integration tests
   ├── E2ETests/
   │   ├── API/
   │   │   ├── Mocked/      ← API E2E tests with mocked DB
   │   │   └── RealDB/      ← API E2E tests with live DB
   │   └── Browser/         ← Playwright/Cypress browser specs
   ├── InfraTests/          ← all 9 infra test files + helpers.js
   └── helpers/
       └── testDb.js        ← shared DB test helper (if applicable)

2. Move every existing test file into the correct subfolder.
   Update every import path in each test file so it still resolves
   correctly from the new location.

3. Key path-update rules:
   - Relative imports to source files (../../src/...) must now use
     the correct number of ../ levels from the new location.
   - Shared test helpers (testDb.js etc.) move to AutomationTests/helpers/
     and their import paths must be updated everywhere they are referenced.
   - The infra helpers.js ROOT constant must be recalculated to point
     to the project root from the new nested location.

4. Update all Vitest/Jest/Playwright config files to point include/testDir
   to the new AutomationTests/ paths.

5. Update all npm test scripts in backend/package.json, frontend/package.json,
   and root package.json to reference the new paths.

6. IMPORTANT — module resolution for tests outside their project root:
   - Frontend tests (run via frontend/vitest.config.js) that now live in
     AutomationTests/ cannot resolve bare imports like "@testing-library/react"
     via Vite's default resolution because they are outside the frontend/
     Vite root. Fix by:
       a. Adding server: { fs: { allow: ['..'] } } to frontend/vitest.config.js
          so Vite can serve files outside frontend/.
       b. Adding resolve.alias entries that map every bare testing-library /
          framework package to its absolute path in frontend/node_modules/:
          '@testing-library/react' → resolve('./node_modules/@testing-library/react')
          'react', 'react-dom', 'react-router-dom', etc. → same pattern.
   - Backend tests (run via backend/vitest.config.js) that live outside
     backend/ cannot resolve bare imports like "express", "supertest" via
     Vite's SSR resolver. Fix by:
       a. Creating backend/vitest.config.js with resolve.alias that maps
          every backend package to its absolute path in backend/node_modules/
       b. Adding server.deps.inline listing those same packages, forcing
          them through Vite's transform pipeline where the alias applies.
   - Create separate per-category vitest config files for the backend
     (vitest.unit.config.js, vitest.integration.config.js, vitest.e2e.config.js)
     each with the same alias/deps settings but different include patterns.

7. Delete all original test directories (backend/tests/, frontend/src/__tests__/,
   the infra/ folder if one was created there, and any root-level spec files).

════════════════════════════════════════════════════════════════
PHASE 6 — VERIFY EVERYTHING STILL PASSES
════════════════════════════════════════════════════════════════
Run every test suite from its correct working directory and fix
any failures introduced by the migration:

  cd frontend && npm test
  cd backend && npm run test:unit
  cd backend && npm run test:integration   (mocked — no DB needed)
  (from root) npm run test:infra:system
  (from root) npm run test:infra:env
  (from root) npm run test:infra:consistency

For each failure:
  - If it is a path/import error → fix the import in the test file
    or the alias in the vitest config.
  - If it is a module-not-found error for a bare specifier →
    add a resolve.alias and server.deps.inline entry in the relevant
    vitest.config.js.
  - If it is a genuine test logic bug (pre-existing) → note it and
    fix the test assertion to match actual correct behaviour.
  - If it is a genuine infrastructure failure (DB not running, Docker
    not running) → this is correct and expected; do NOT mask it.

After all fixes, produce a final test results summary table:
  Suite | Files | Tests | Passed | Failed | Notes

════════════════════════════════════════════════════════════════
PHASE 7 — CREATE MASTER RUNNER SCRIPT & DOCUMENTATION
════════════════════════════════════════════════════════════════
1. Create AutomationTests/run-all-tests.js — a single Node.js ESM script
   that runs every test suite stage by stage from the project root.

   The script must:
   a. Define a numbered stage list covering all groups in this exact order:
        Stages 1–9   → Infrastructure pre-flights (one per infra test file)
        Stage 10     → Backend Unit Tests
        Stage 11     → Backend Integration Tests (Mocked DB)
        Stage 12     → Backend E2E API Tests (Mocked DB)
        Stage 13     → Frontend Unit Tests
        Stage 14     → Frontend Component Integration Tests
        Stage 15     → Frontend Page Integration Tests
        Stage 16     → Browser E2E (Playwright)

   b. Accept these CLI flags:
        --stop-on-failure   Abort on the first failing stage
        --skip-infra        Skip stages 1–9
        --skip-browser      Skip stage 16
        --stages <list>     Run only the listed stage numbers
                            (comma-separated, e.g. --stages 1,2,10,13)

   c. For each stage:
      - Print a clear section header showing stage number / total and name
      - Show the exact command being run and the working directory (cwd)
      - Spawn the npm script using child_process.spawnSync with stdio: 'inherit'
        so live test output is streamed to the terminal
      - Print ✅ PASSED or ❌ FAILED with the exit code after each stage
      - Record { id, group, name, passed, elapsed } for the summary

   d. After all stages, print a formatted summary table:
        #  | Group          | Stage                           | Result  | Time
        ---|----------------|---------------------------------|---------|-----
        1  | Infrastructure | System Requirements             | ✅ PASS | 2.1s
        ...
      Then print totals: Passed N  Failed N  Skipped N  Total time Xs
      If any stage failed, list the failing stage names beneath the table.

   e. Exit with code 1 if any stage failed, 0 if all passed.

   f. Use ANSI colour codes for terminal output (green for pass, red for
      fail, yellow for dividers, cyan for banners) but detect process.stdout.isTTY
      and disable colours when output is piped/redirected.

   g. The script must be runnable on both Windows and Unix:
      - Detect process.platform === 'win32' and use 'npm.cmd' instead of 'npm'
      - Use ES module syntax (import/export) since root package.json has
        "type": "module"
      - Derive __dirname from fileURLToPath(import.meta.url)

2. Add these convenience scripts to root package.json:
     "test:all"            → "node AutomationTests/run-all-tests.js"
     "test:all:stop"       → "node AutomationTests/run-all-tests.js --stop-on-failure"
     "test:all:skip-infra" → "node AutomationTests/run-all-tests.js --skip-infra"
     "test:all:quick"      → "node AutomationTests/run-all-tests.js --skip-infra --skip-browser"

3. Create AutomationTests/TestRunner.md — a comprehensive guide for
   anyone landing on the project (especially on a new server). Include:

   a. Prerequisites table (Node, npm, Docker minimum versions + install command)

   b. Quick-start section showing the four npm run test:all:* shortcuts
      and what each one does

   c. Full stage map table (# | Group | Stage name)

   d. "Run specific stages" section with --stages examples:
      - Run only infra checks
      - Run only backend tests (stages 10–12)
      - Run only frontend tests (stages 13–15)
      - Run only Playwright (stage 16)
      - Combined examples with --stop-on-failure

   e. "Run by category" section with the exact npm script for every
      granular test category (each infra sub-check, backend unit/
      integration/e2e, frontend unit/components/pages, Playwright UI
      mode, single spec file, headed mode, show-report)

   f. "Combining flags" section with at least 3 real-world examples

   g. Annotated folder tree of the full AutomationTests/ structure

   h. "What each infra failure means" reference table:
      Stage | Failure symptom | Typical fix command
      Cover all 9 infra stages with the most common failure and its fix.

   i. "Recommended test order on a fresh server" — a numbered checklist
      from "install dependencies" through to "run full E2E", showing
      which services need to be started at each step.

════════════════════════════════════════════════════════════════
GENERAL RULES FOR THE ENTIRE TASK
════════════════════════════════════════════════════════════════
- Never delete source code — only move or add test files and configs.
- Keep each test file focused on one concern.
- Test files in AutomationTests/ must NOT import from each other except
  via AutomationTests/helpers/.
- Every test failure message must be actionable (tell the developer
  exactly what command to run or what config to change to fix it).
- Use the same testing framework that already exists in the project
  wherever possible; only introduce a new framework if a category has
  no existing coverage at all.
- All new npm dependencies must be added as devDependencies.
- Do not add comments that simply narrate what code does (e.g., "// import
  the module"). Only add comments explaining non-obvious intent or trade-offs.
- After completing all seven phases, confirm the final folder structure
  with a directory tree and list all new or modified files.
```
