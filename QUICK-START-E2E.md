# Quick Start: End-to-End Validation

## 🚀 Easiest Way (Recommended)

### One-Command Test Runner

```bash
# Check servers, dependencies, and run test automatically
node run-e2e-test.js playwright
# OR
node run-e2e-test.js puppeteer
```

This master script will:
1. ✅ Check if servers are running
2. ✅ Verify dependencies are installed
3. ✅ Run the E2E test
4. ✅ Provide comprehensive results

---

## Manual Setup (If Preferred)

### Option 1: Playwright (Recommended - More Features)

#### Install
```bash
npm install -D @playwright/test
npx playwright install chromium
```

#### Run Test
```bash
# With visible browser (recommended for first run)
npx playwright test e2e-validation.spec.js --headed --slowmo=500

# Headless mode (faster)
npx playwright test e2e-validation.spec.js

# With debugging
npx playwright test e2e-validation.spec.js --debug
```

#### View Report
```bash
npx playwright show-report
```

### Option 2: Puppeteer (Simpler Setup)

#### Install
```bash
npm install puppeteer
```

#### Run Test
```bash
node e2e-validation-puppeteer.js
```

---

## Quick Server Check

```bash
# Verify servers are running before testing
node check-servers.js
```

## Before Running Tests

**Ensure both servers are running:**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Verify:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## What Gets Tested

1. ✅ Login (with guest limit fallback to registration)
2. ✅ Flight Search (New Delhi → Mumbai, tomorrow, 1 adult)
3. ✅ Flight Selection (first available flight)
4. ✅ Passenger Details (John Doe, john.doe@example.com)
5. ✅ Add-ons Selection (at least one if available)
6. ✅ Summary Review (with confirmation checkbox)
7. ✅ Payment (UPI: test@upi OR Card: 4111111111111111)
8. ✅ Confirmation Page (booking success)

## Expected Output

```
================================================================================
END-TO-END VALIDATION REPORT
================================================================================

OVERALL RESULT: PASS

FINAL URL: http://localhost:5173/confirmation

--- STEP-BY-STEP RESULTS ---
✅ Step 1: Login: PASS
   Logged in successfully
✅ Step 2: Flight Search: PASS
   Search form filled with valid data
✅ Step 3: Flight Selection: PASS
   Found 5 flights
✅ Step 4: Passenger Details: PASS
   Passenger details filled
✅ Step 5: Add-ons: PASS
   Selected add-on
✅ Step 6: Summary: PASS
   Navigated to summary page
✅ Step 7: Payment: PASS
   Payment details filled
✅ Step 8: Confirmation: PASS
   Booking confirmed successfully

================================================================================
```

## Troubleshooting

**"Cannot find module '@playwright/test'"**
→ Run: `npm install -D @playwright/test`

**"Cannot find module 'puppeteer'"**
→ Run: `npm install puppeteer`

**"Timeout waiting for page"**
→ Ensure backend and frontend are running on correct ports

**"No flights found"**
→ Check backend has seeded flight data: `cd backend && npm run seed`

**"Guest limit exceeded"**
→ Test automatically handles this by registering a new user

## Files Created

- `e2e-validation.spec.js` - Playwright test script
- `e2e-validation-puppeteer.js` - Puppeteer test script
- `playwright.config.js` - Playwright configuration
- `E2E-TEST-SETUP.md` - Detailed documentation
- `QUICK-START-E2E.md` - This file

## Need Help?

See detailed documentation: `E2E-TEST-SETUP.md`
