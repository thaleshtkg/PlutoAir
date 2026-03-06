# End-to-End Validation Test Setup

This document explains how to run the automated end-to-end validation test for the Flight Booking Application.

## Prerequisites

1. **Node.js** installed (v16 or higher)
2. **Backend server** running on `http://localhost:5000`
3. **Frontend server** running on `http://localhost:5173`

## Installation

### Step 1: Install Playwright

From the project root directory, run:

```bash
npm init -y
npm install -D @playwright/test
npx playwright install chromium
```

This will:
- Create a `package.json` if it doesn't exist
- Install Playwright test runner
- Download the Chromium browser for testing

### Step 2: Verify Servers are Running

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Verify:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Running the Test

### Option 1: Run with UI (Recommended for first run)

```bash
npx playwright test e2e-validation.spec.js --headed --slowmo=500
```

This will:
- Open a browser window so you can watch the test
- Slow down actions by 500ms for better visibility

### Option 2: Run in Headless Mode (Faster)

```bash
npx playwright test e2e-validation.spec.js
```

### Option 3: Run with Debug Mode

```bash
npx playwright test e2e-validation.spec.js --debug
```

This opens Playwright Inspector for step-by-step debugging.

## Test Flow

The test validates the following complete booking flow:

1. **Login** - Attempts login with `admin/admin@123`
   - If guest limit blocks login, registers a new user automatically
   
2. **Flight Search** - Searches for flights
   - Origin: New Delhi
   - Destination: Mumbai
   - Date: Tomorrow
   - Passengers: 1 adult
   - Type: One-way

3. **Flight Selection** - Selects the first available flight

4. **Passenger Details** - Fills required passenger information
   - Name: John Doe
   - Email: john.doe@example.com
   - Phone: 9876543210

5. **Add-ons** - Selects at least one add-on (if available)

6. **Summary** - Reviews booking and checks confirmation checkbox

7. **Payment** - Completes payment with test credentials
   - UPI: test@upi
   - OR Card: 4111111111111111, 12/25, 123

8. **Confirmation** - Verifies successful booking completion

## Understanding Test Results

### Console Output

The test provides detailed console output for each step:

```
=== Step 1: Login ===
Found login form
Attempting login with admin credentials
...

================================================================================
END-TO-END VALIDATION REPORT
================================================================================

OVERALL RESULT: PASS

FINAL URL: http://localhost:5173/confirmation

--- STEP-BY-STEP RESULTS ---
✅ Step 1: Login: PASS
   Logged in successfully, redirected to http://localhost:5173/search
✅ Step 2: Flight Search: PASS
   Search form filled with valid data
...
```

### Test Artifacts

On failure, the test generates:

1. **Screenshots** - `error-<timestamp>.png` in project root
2. **Videos** - In `test-results/` folder
3. **Traces** - In `test-results/` folder (can be viewed with `npx playwright show-trace <trace-file>`)

### HTML Report

After test completion, view the detailed HTML report:

```bash
npx playwright show-report
```

## Validation Requirements

The test validates:

✅ **Page Transitions** - Confirms navigation between pages
✅ **UI State** - Verifies buttons are enabled/disabled appropriately
✅ **Form Validation** - Checks required fields and validation behavior
✅ **Success/Error Messages** - Captures and reports all messages
✅ **Console Errors** - Logs JavaScript console errors
✅ **Network Errors** - Captures failed API requests
✅ **Final State** - Confirms booking completion

## Troubleshooting

### Test Fails at Login

**Issue:** "Guest limit exceeded"
**Solution:** Test automatically registers a new user. If this fails, check backend user creation endpoint.

### Test Fails at Flight Search

**Issue:** No flights found
**Solution:** 
- Verify backend is running and seeded with flight data
- Check date is in the future
- Verify origin/destination airports exist in database

### Test Fails at Payment

**Issue:** Payment not processing
**Solution:**
- Check backend payment endpoint is working
- Verify test payment credentials are accepted
- Check for console/network errors in test output

### Timeout Errors

**Issue:** Test times out waiting for page
**Solution:**
- Increase timeout in `playwright.config.js`
- Check if backend/frontend are responding slowly
- Verify network is not blocking requests

## Customization

### Change Test Credentials

Edit `e2e-validation.spec.js`:

```javascript
const TEST_USER = {
  username: 'your-username',
  password: 'your-password'
};
```

### Change Search Parameters

Edit the search section in `e2e-validation.spec.js`:

```javascript
await originField.fill('Your Origin');
await destField.fill('Your Destination');
// ... etc
```

### Run on Different Browsers

Edit `playwright.config.js` and uncomment browser projects:

```javascript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
],
```

Then run:
```bash
npx playwright test --project=firefox
```

## CI/CD Integration

To run in CI/CD pipelines:

```bash
# Install dependencies
npm install -D @playwright/test
npx playwright install --with-deps chromium

# Run tests
npx playwright test e2e-validation.spec.js --reporter=json
```

## Expected Output Format

The test provides a comprehensive report with:

- **PASS/FAIL** overall status
- **Step-by-step results** with pass/fail for each stage
- **Exact failure points** with error messages and URLs
- **Console errors** captured from browser
- **Network errors** from failed API calls
- **Final URL** reached in the flow

## Support

If you encounter issues:

1. Check that both servers are running
2. Review the HTML report: `npx playwright show-report`
3. Run with `--debug` flag for step-by-step inspection
4. Check screenshots in project root for visual debugging
5. Review console and network error logs in test output
