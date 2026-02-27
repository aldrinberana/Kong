# Kong Manager E2E Tests with Playwright

Comprehensive end-to-end test suite for Kong Manager using [Playwright](https://playwright.dev).

## 🎯 Overview

This project provides automated testing for Kong Gateway Manager's UI, covering:
- **Gateway Services** — create and validation
- **Routes** — create routes within services with HTTP methods, paths, and hosts
- **API Integration** — verify changes persist via Kong Admin API
- **Cleanup & Isolation** — automatic entity tracking and per-test cleanup

## 📋 Prerequisites

- **Node.js** 16+ (preferably 18 LTS)
- **Docker Desktop** (docker-compose.yml)
- **Kong Gateway** running locally (Admin API on `localhost:8001`, Manager UI on `localhost:8002`)


## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Copy the example env file and customize:

```bash
cp env.example .env
```

Edit `.env`:

```plaintext
KONG_MANAGER_URL=http://localhost:8002
KONG_ADMIN_URL=http://localhost:8001
HEADLESS=false
```

### 3. Install Playwright Browsers

```bash
npx playwright install --with-deps
```

### 4. Run Tests

**Single worker (serial, safest for local dev):**

```bash
npx playwright test
```

**With multiple workers (parallel, faster but requires isolation):**

```bash
npx playwright test --workers=4
```

**Headed mode (see browser in action):**

```bash
npx playwright test --headed
```

**Single test file:**

```bash
npx playwright test tests/service\ create.spec.ts
```

**Watch mode (re-run on file changes):**

```bash
npx playwright test --watch
```

## 📊 Test Reports

View the HTML test report after a run:

```bash
npx playwright show-report
```

Machine-readable JSON results: `test-results/results.json`

Video traces and screenshots: `playwright-report/trace/` and test-results folders

## 🏗️ Project Structure

```
.
├── README.md                           # This file
├── playwright.config.ts               # Playwright configuration
├── .env                               # Environment variables (git-ignored)
├── package.json                       # Dependencies
│
├── fixtures/
│   ├── kong.fixtures.ts              # Test fixtures (page objects, API helper, hooks)
│   └── test-data.ts                  # Test data factories & uniqueSuffix()
│
├── pages/                             # Page Object Model (POM)
│   ├── BasePage.ts                   # Base class with shared methods
│   ├── ServicesListPage.ts           # Services list page
│   ├── ServiceFormPage.ts            # Service create/edit form
│   ├── ServiceDetailPage.ts          # Service detail view (routes tab)
│   ├── RouteFormPage.ts              # Route create/edit form
│   └── index.ts                      # Barrel export
│
├── tests/
│   ├── service\ create.spec.ts       # Service creation tests
│   ├── route\ create.spec.ts         # Route creation tests
│   ├── clean.spec.ts                 # Manual cleanup spec (@cleanup)
│   └── example.spec.ts               # Playwright sample test
│
├── utils/
│   ├── entity-tracker.ts             # Track created entity IDs for cleanup
│   ├── global-setup.ts               # Pre-suite: verify Kong connectivity
│   ├── global-teardown.ts            # Post-suite: delete tracked entities via API
│   ├── cleanup.ts                    # Reusable cleanup helper (called from fixtures)
│   └── kong-api-helper.ts            # Admin API wrapper (get/create/delete services & routes)
│
├── test-results/                     # Test output & artifacts
│   ├── created-entities.json         # Tracked entity IDs (written by fixtures, read by teardown)
│   └── results.json                  # JSON test report
│
└── playwright-report/                # HTML test report & traces
    ├── index.html
    ├── data/
    └── trace/
```

## 🔧 Configuration

### `playwright.config.ts`

Key settings:

```typescript
{
  testDir: './tests',
  fullyParallel: false,           // Tests in a file run sequentially
  workers: 1,                     // Single worker (see limitation below)
  use: {
    baseURL: 'http://localhost:8002',  // Kong Manager URL
    headless: false,                   // Set to true for CI
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
  ],
  globalSetup: 'utils/global-setup.ts',
  globalTeardown: 'utils/global-teardown.ts',
}
```

### ⚠️ Limitation: Single Service, Single Worker

**Current Configuration:** This test suite uses a **single shared Kong service instance** across all tests. Due to this shared service model, parallel execution is **not recommended** for the following reasons:

- **Shared Service State:** Multiple workers cannot safely modify the same Kong service instance simultaneously
- **Cleanup Dependencies:** Each test requires complete cleanup of services and routes before the next test starts
- **Race Conditions:** Concurrent tests may create/delete entities during cleanup, causing failures

**Current Setup:** `workers: 1` ensures tests run sequentially with guaranteed cleanup between each test.

**Future Enhancement Options:**
1. **Per-Worker Service Instances** — Deploy separate Kong services for each worker (requires Docker Compose scaling)
2. **Run-Scoped Entity Names** — Use unique prefixes per test run to isolate entities in parallel execution
3. **API-First Setup** — Create isolated test data via Admin API before UI tests

### Environment Variables (`.env`)

```plaintext
# Kong connectivity
KONG_MANAGER_URL=http://localhost:8002
KONG_ADMIN_URL=http://localhost:8001
KONG_ADMIN_TOKEN=                     

# Test behavior
HEADLESS=false                          # true = headless mode, false = see browser

# Optional naming overrides
TEST_SERVICE_NAME=my-service
TEST_ROUTE_NAME=my-route
```

## 🧪 Test Suite Overview

### Service Create Tests (`tests/service create.spec.ts`)

- ✅ Create service with required fields only
- ✅ Create service with all optional fields (retries, timeouts, tags)
- ✅ Reject duplicate service names
- ✅ New service appears in list after creation

### Route Create Tests (`tests/route create.spec.ts`)

- ✅ Create route via service detail page
- ✅ Create route with multiple paths and HTTP methods
- ✅ Route appears in service's routes table
- ✅ Route is retrievable via Admin API

### Manual Cleanup (`tests/clean.spec.ts`)

Run manually when test suite crashes before cleanup:

```bash
npx playwright test --grep @cleanup
```

## 🔄 Cleanup & Entity Tracking

### How It Works

1. **Test starts → `beforeEach` hook runs:**
   - Waits 1000ms
   - Calls `cleanupTestEntities()` to remove any leftover entities

2. **Test creates services/routes:**
   - Each creation calls `trackService(id)` or `trackRoute(id)`
   - IDs are written to `test-results/created-entities.json`

3. **Test ends → `afterEach` hook runs:**
   - Waits 500ms
   - Calls `cleanupTestEntities()` to delete created entities

4. **All tests finish → Global teardown runs:**
   - Reads `created-entities.json`
   - Deletes remaining entities via Admin API
   - Clears the tracking file

### Timeout Before Cleanup

To allow Kong time to process deletions, cleanup waits before running:

```typescript
// beforeEach: wait 1 second
await cleanupTestEntities(kongApi, 1000);

// afterEach: wait 500ms
await cleanupTestEntities(kongApi, 1000);

// Custom: wait 2 seconds
await cleanupTestEntities(kongApi, 2000);
```

Adjust per your Kong response times.

## ⚡ Running in Parallel (Multiple Workers)

⚠️ **Currently Not Recommended** — See **Limitation: Single Service, Single Worker** above.

The test suite is configured for **single-worker serial execution** to avoid race conditions and ensure reliable cleanup. If you attempt to run with multiple workers:

```bash
# NOT RECOMMENDED with current setup
npx playwright test --workers=4
```

Tests may fail due to:
- Multiple workers trying to clean/modify the same service simultaneously
- Entity deletion failures mid-test
- Race conditions between cleanup and test execution

**To enable parallel execution**, you would need to:
1. Deploy per-worker Kong service instances (Docker Compose scaling)
2. Implement run-scoped entity naming (e.g., `svc-run-12345-service1`)
3. Or separate services via environment variable configuration per worker

## 🏃 Common Commands

```bash
# Install & set up
npm install
npx playwright install --with-deps

# Run all tests (serial)
npx playwright test

# Run with 4 parallel workers
npx playwright test --workers=4

# Run with browser visible
npx playwright test --headed

# Run a single test file
npx playwright test tests/service\ create.spec.ts

# Run tests matching a pattern
npx playwright test --grep "creates a service"

# Run tests in debug mode (interactive inspector)
npx playwright test --debug

# Run only the @cleanup spec
npx playwright test --grep @cleanup

# Watch mode (re-run on file changes)
npx playwright test --watch

# View test report
npx playwright show-report

# Collect test coverage (if configured)
npx playwright test --reporter=@web/test-runner
```

## 🔐 CI/CD Integration

### Playwright GitHub Workflow (`.github/workflows/playwright.yml`)

This repository includes an automated GitHub Actions workflow that runs Playwright tests on every push and pull request.

**What it does:**

1. **Triggers:** Runs on push/pull request to `main` or `master` branches
2. **Services:** Spins up containerized dependencies:
   - **PostgreSQL** — Kong's database backend
   - **Kong Gateway** — The service under test (with Postgres connection)
3. **Test Execution:**
   - Installs dependencies (`npm ci`)
   - Installs Playwright browsers (`npx playwright install --with-deps`)
   - Runs all tests respecting `playwright.config.ts` settings (single worker, serial execution)
4. **Artifacts:** Uploads test report to GitHub (retained for 30 days)

**Workflow File Location:** [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml)

**Key Configuration:**

```yaml
services:
  postgres:
    image: postgres                    # Kong database
    env:
      POSTGRES_USER: kong
      POSTGRES_PASSWORD: kong
      KONG_DB: kong

  kong:
    image: kong/kong-gateway           # Kong service under test
    env:
      KONG_DATABASE: postgres          # Use Postgres (not in-memory)
      KONG_PG_HOST: postgres           # Docker service name
      KONG_ADMIN_LISTEN: 0.0.0.0:8001  # Admin API accessible on all interfaces
```

**Single Worker Guarantee:** The workflow runs with the `workers: 1` setting from `playwright.config.ts`, ensuring reliable test execution without race conditions or cleanup conflicts (see **Limitation: Single Service, Single Worker** above).

**Artifact Retention:** Test reports are retained for 30 days and can be downloaded from the GitHub Actions run details.

## 🚧 Future Enhancements

- [ ] Run-scoped cleanup (use `TEST_RUN_ID` env var to scope entity names per worker)
- [ ] Per-worker Kong instances (isolation via container ports)
- [ ] Data-driven tests (CSV/JSON test data sets)
- [ ] Visual regression testing
- [ ] API-first setup (create entities via API before UI tests)

## 🤝 Contributing

1. Fork and create a feature branch
2. Add/update tests in `tests/`
3. Update page objects in `pages/` if UI changes
4. Ensure cleanup is called (via fixture hooks or manually)
5. Run locally before pushing: `npx playwright test --headed`
6. Commit and submit a pull request

## 📚 Resources

- [Playwright Docs](https://playwright.dev)
- [Kong Admin API Docs](https://docs.konghq.com/gateway/latest/admin-api/)
- [Kong Manager Docs](https://docs.konghq.com/gateway/latest/kong-manager/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
