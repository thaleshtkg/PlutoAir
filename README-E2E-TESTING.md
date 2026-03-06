# End-to-End Testing for Flight Booking Application

## 📋 Overview

This directory contains a complete automated end-to-end testing solution for validating the Flight Booking Application from login to booking confirmation.

## 🎯 What Gets Tested

The E2E test validates the complete booking flow:

1. **Login** → Admin login or new user registration
2. **Search** → Flight search (New Delhi → Mumbai)
3. **Select** → Flight selection from results
4. **Passengers** → Passenger details form
5. **Add-ons** → Add-on selection
6. **Summary** → Booking review
7. **Payment** → Payment processing
8. **Confirmation** → Booking success verification

## 🚀 Quick Start

### Prerequisites

Ensure both servers are running:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Run E2E Test (Easiest Method)

```bash
# Install dependencies first (one-time setup)
npm install -D @playwright/test
npx playwright install chromium

# Run the test with automatic checks
node run-e2e-test.js playwright
```

That's it! The script will:
- ✅ Verify servers are running
- ✅ Check dependencies
- ✅ Run the complete E2E test
- ✅ Generate detailed report

## 📁 Files Included

| File | Description |
|------|-------------|
| `run-e2e-test.js` | **Master script** - Checks servers & runs tests |
| `check-servers.js` | Server health check utility |
| `e2e-validation.spec.js` | Playwright test script (recommended) |
| `e2e-validation-puppeteer.js` | Puppeteer test script (alternative) |
| `playwright.config.js` | Playwright configuration |
| `QUICK-START-E2E.md` | Quick reference guide |
| `E2E-TEST-SETUP.md` | Detailed setup documentation |
| `E2E-VALIDATION-SUMMARY.md` | Complete feature overview |
| `README-E2E-TESTING.md` | This file |

## 🎬 Usage Examples

### 1. Run with Playwright (Recommended)

```bash
# Full automated run
node run-e2e-test.js playwright

# Or manually
npx playwright test e2e-validation.spec.js --headed --slowmo=500
```

**Benefits:**
- Rich HTML reports
- Video recording on failure
- Trace viewer for debugging
- Multiple browser support

### 2. Run with Puppeteer (Simpler)

```bash
# Full automated run
node run-e2e-test.js puppeteer

# Or manually
node e2e-validation-puppeteer.js
```

**Benefits:**
- Lighter weight
- Simpler setup
- Faster installation

### 3. Check Server Status Only

```bash
node check-servers.js
```

### 4. Debug Mode

```bash
# Playwright debug mode
npx playwright test e2e-validation.spec.js --debug

# Puppeteer (edit file to set headless: false)
```

## 📊 Understanding Results

### Success Output

```
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

### Failure Output

When a test fails, you'll get:
- ❌ Exact step where failure occurred
- 📝 Error message and root cause
- 🌐 URL where failure happened
- 📸 Screenshot (`error-<timestamp>.png`)
- 🎥 Video recording (Playwright only)
- 📋 Console and network errors

## 🔧 Customization

### Change Test Credentials

Edit in test file:
```javascript
const TEST_USER = {
  username: 'your-username',
  password: 'your-password'
};
```

### Change Search Parameters

Edit in test file:
```javascript
// Search section
await originField.fill('Your Origin');
await destField.fill('Your Destination');
const dateString = 'YYYY-MM-DD'; // Your date
```

### Adjust Timeouts

Edit `playwright.config.js`:
```javascript
timeout: 120000, // Overall test timeout
navigationTimeout: 30000, // Page navigation
actionTimeout: 10000, // Element actions
```

## 🐛 Troubleshooting

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module '@playwright/test'" | Run: `npm install -D @playwright/test` |
| "Cannot find module 'puppeteer'" | Run: `npm install puppeteer` |
| "Timeout waiting for page" | Check servers are running on correct ports |
| "No flights found" | Seed backend: `cd backend && npm run seed` |
| "Guest limit exceeded" | Test auto-handles by registering new user |
| "Payment fails" | Verify backend payment endpoint is working |

### Debug Steps

1. **Check servers are running**
   ```bash
   node check-servers.js
   ```

2. **Run with visible browser**
   ```bash
   npx playwright test e2e-validation.spec.js --headed --slowmo=1000
   ```

3. **Check screenshots**
   - Look for `error-*.png` files in project root

4. **View detailed report** (Playwright)
   ```bash
   npx playwright show-report
   ```

5. **Check console/network errors**
   - Review test output for captured errors

## 🎯 Validation Coverage

The test validates:

✅ **Functional Requirements**
- User authentication (login/registration)
- Flight search functionality
- Flight selection process
- Passenger information collection
- Add-on selection
- Booking summary review
- Payment processing
- Confirmation generation

✅ **UI/UX Validation**
- Page transitions
- Button enable/disable states
- Form validation behavior
- Success/error messages
- Loading states

✅ **Technical Validation**
- Console errors
- Network failures
- API response handling
- Navigation flow
- Data persistence

## 🔄 CI/CD Integration

To integrate into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: |
    npm install -D @playwright/test
    npx playwright install --with-deps chromium

- name: Start servers
  run: |
    cd backend && npm run dev &
    cd frontend && npm run dev &
    sleep 10

- name: Run E2E tests
  run: node run-e2e-test.js playwright

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

## 📚 Additional Resources

- **Quick Start**: See `QUICK-START-E2E.md` for fastest setup
- **Detailed Guide**: See `E2E-TEST-SETUP.md` for comprehensive docs
- **Feature Summary**: See `E2E-VALIDATION-SUMMARY.md` for complete overview
- **Playwright Docs**: https://playwright.dev/
- **Puppeteer Docs**: https://pptr.dev/

## 🎓 Best Practices

1. **Always check servers first**
   ```bash
   node check-servers.js
   ```

2. **Run with visible browser initially**
   - Helps understand test flow
   - Easier to debug issues

3. **Review screenshots on failure**
   - Visual context is invaluable

4. **Keep test data consistent**
   - Use predictable test credentials
   - Ensure backend is seeded

5. **Monitor console/network errors**
   - Even if test passes, check for warnings

## 🤝 Contributing

To add new test scenarios:

1. Open `e2e-validation.spec.js` or `e2e-validation-puppeteer.js`
2. Add new test steps following existing pattern
3. Update validation checks
4. Document expected behavior

## 📝 Notes

- **Guest Limit Handling**: Test automatically registers a new user if admin login is blocked
- **Optional Fields**: Test gracefully handles fields that may not be present
- **Timing**: Includes appropriate waits for network and UI updates
- **Error Recovery**: Attempts to continue after non-critical failures
- **Cross-browser**: Playwright supports Chrome, Firefox, Safari (configure in `playwright.config.js`)

## ✅ Summary

This E2E testing solution provides:

- ✅ **Fully automated** validation of complete booking flow
- ✅ **Comprehensive reporting** with pass/fail for each step
- ✅ **Error capture** including screenshots and logs
- ✅ **Easy setup** with master script and clear documentation
- ✅ **Flexible** - Choose Playwright or Puppeteer
- ✅ **CI/CD ready** for automated pipelines
- ✅ **Customizable** for different test scenarios

Simply run `node run-e2e-test.js playwright` and get a complete validation report!

---

**Need Help?** Check `QUICK-START-E2E.md` or `E2E-TEST-SETUP.md` for more details.
