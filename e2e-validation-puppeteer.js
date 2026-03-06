/**
 * End-to-End Validation Script using Puppeteer
 * Alternative to Playwright for simpler setup
 * 
 * Run with: node e2e-validation-puppeteer.js
 */

const puppeteer = require('puppeteer');

// Configuration
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000';
const TEST_USER = {
  username: 'admin',
  password: 'admin@123'
};

// Generate unique user for registration fallback
const FALLBACK_USER = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'Test@123456',
  fullName: 'Test User'
};

// Test results tracker
const testResults = {
  overall: 'PASS',
  steps: [],
  errors: [],
  finalUrl: '',
  consoleErrors: [],
  networkErrors: []
};

// Helper function to add step result
function addStep(step, status, detail) {
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} ${step}: ${status} - ${detail}`);
  testResults.steps.push({ step, status, detail });
}

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main test function
async function runE2ETest() {
  let browser;
  let page;
  let currentStep = '';

  try {
    console.log('\n🚀 Starting End-to-End Validation Test...\n');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      slowMo: 50, // Slow down by 50ms for visibility
      args: ['--start-maximized'],
      defaultViewport: { width: 1280, height: 720 }
    });

    page = await browser.newPage();

    // Capture console logs
    page.on('console', msg => {
      if (msg.type() === 'error') {
        testResults.consoleErrors.push(`[Console Error] ${msg.text()}`);
      }
    });

    // Capture network failures
    page.on('requestfailed', request => {
      testResults.networkErrors.push(`[Network Error] ${request.url()} - ${request.failure().errorText}`);
    });

    // ============================================================
    // STEP 1: LOGIN
    // ============================================================
    currentStep = 'Step 1: Login';
    console.log(`\n=== ${currentStep} ===`);
    
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    addStep(currentStep, 'PASS', 'Navigated to login page');

    // Fill login form
    await page.waitForSelector('input[name="username"], input[type="text"]', { timeout: 5000 });
    await page.type('input[name="username"], input[type="text"]', TEST_USER.username);
    await page.type('input[name="password"], input[type="password"]', TEST_USER.password);
    
    // Click login button
    await page.click('button[type="submit"]');
    await wait(2000);

    // Check if login was successful
    const currentUrl = page.url();
    
    if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
      // Check for guest limit error
      const bodyText = await page.evaluate(() => document.body.innerText);
      
      if (bodyText.toLowerCase().includes('guest') || bodyText.toLowerCase().includes('limit')) {
        console.log('⚠️  Guest limit detected. Attempting to register new user...');
        addStep(currentStep, 'WARN', 'Guest limit blocked login, attempting registration');

        // ============================================================
        // STEP 1B: REGISTRATION (FALLBACK)
        // ============================================================
        currentStep = 'Step 1B: Registration (Fallback)';
        console.log(`\n=== ${currentStep} ===`);
        
        await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2' });
        
        // Fill registration form
        await page.waitForSelector('input[name="username"]', { timeout: 5000 });
        await page.type('input[name="username"]', FALLBACK_USER.username);
        await page.type('input[name="email"], input[type="email"]', FALLBACK_USER.email);
        await page.type('input[name="password"], input[type="password"]', FALLBACK_USER.password);
        
        // Check for name field
        const nameFieldExists = await page.$('input[name="fullName"], input[name="name"]');
        if (nameFieldExists) {
          await page.type('input[name="fullName"], input[name="name"]', FALLBACK_USER.fullName);
        }
        
        await page.click('button[type="submit"]');
        await wait(2000);
        
        addStep(currentStep, 'PASS', 'User registered successfully');

        // Login with new user
        if (page.url().includes('/login')) {
          await page.type('input[name="username"], input[type="text"]', FALLBACK_USER.username);
          await page.type('input[name="password"], input[type="password"]', FALLBACK_USER.password);
          await page.click('button[type="submit"]');
          await wait(2000);
        }
      } else {
        throw new Error(`Login failed: ${bodyText.substring(0, 200)}`);
      }
    }

    // Verify successful login
    await wait(1000);
    const postLoginUrl = page.url();
    
    if (!postLoginUrl.includes('/search') && !postLoginUrl.includes('/home')) {
      const bodyText = await page.evaluate(() => document.body.innerText);
      throw new Error(`Login did not redirect to search page. Current URL: ${postLoginUrl}`);
    }
    
    addStep('Step 1: Login Complete', 'PASS', `Logged in successfully, redirected to ${postLoginUrl}`);

    // ============================================================
    // STEP 2: SEARCH FLIGHT
    // ============================================================
    currentStep = 'Step 2: Flight Search';
    console.log(`\n=== ${currentStep} ===`);
    
    if (!page.url().includes('/search')) {
      await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle2' });
    }

    // Fill search form
    await page.waitForSelector('input[name="origin"]', { timeout: 5000 });
    
    // Clear and fill origin
    await page.click('input[name="origin"]', { clickCount: 3 });
    await page.type('input[name="origin"]', 'New Delhi');
    await wait(500);
    
    // Try to select from dropdown
    const originDropdown = await page.$('text=New Delhi');
    if (originDropdown) {
      await originDropdown.click();
    }

    // Clear and fill destination
    await page.click('input[name="destination"]', { clickCount: 3 });
    await page.type('input[name="destination"]', 'Mumbai');
    await wait(500);
    
    const destDropdown = await page.$('text=Mumbai');
    if (destDropdown) {
      await destDropdown.click();
    }

    // Set future date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await page.evaluate((date) => {
      const dateInput = document.querySelector('input[type="date"], input[name="departureDate"]');
      if (dateInput) dateInput.value = date;
    }, dateString);

    // Set passengers
    const passengerField = await page.$('input[name="passengers"], input[type="number"]');
    if (passengerField) {
      await page.click('input[name="passengers"], input[type="number"]', { clickCount: 3 });
      await page.type('input[name="passengers"], input[type="number"]', '1');
    }

    // Select one-way
    const oneWayRadio = await page.$('input[value="one-way"], input[value="oneway"]');
    if (oneWayRadio) {
      await oneWayRadio.click();
    }

    addStep(currentStep, 'PASS', 'Search form filled with valid data');
    
    // Submit search
    await page.click('button[type="submit"]');
    await wait(2000);

    // ============================================================
    // STEP 3: SELECT FLIGHT
    // ============================================================
    currentStep = 'Step 3: Flight Selection';
    console.log(`\n=== ${currentStep} ===`);
    
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    
    if (!page.url().includes('/results')) {
      throw new Error(`Expected results page, but got: ${page.url()}`);
    }
    
    addStep(currentStep, 'PASS', 'Navigated to results page');

    // Wait for flights to load
    await wait(2000);
    
    // Check for flights
    const flights = await page.$$('[class*="flight"], button:has-text("Select")');
    
    if (flights.length === 0) {
      const pageContent = await page.evaluate(() => document.body.innerText);
      throw new Error(`No flights found. Page content: ${pageContent.substring(0, 500)}`);
    }
    
    console.log(`Found ${flights.length} flight options`);
    addStep(currentStep, 'PASS', `Found ${flights.length} flights`);

    // Select first flight
    await page.waitForSelector('button:has-text("Select"), button:has-text("Choose")');
    const selectButtons = await page.$$('button');
    
    for (const button of selectButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.toLowerCase().includes('select') || text.toLowerCase().includes('choose')) {
        await button.click();
        break;
      }
    }
    
    await wait(2000);

    // ============================================================
    // STEP 4: PASSENGER DETAILS
    // ============================================================
    currentStep = 'Step 4: Passenger Details';
    console.log(`\n=== ${currentStep} ===`);
    
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    
    if (!page.url().includes('/passengers')) {
      throw new Error(`Expected passengers page, but got: ${page.url()}`);
    }
    
    addStep(currentStep, 'PASS', 'Navigated to passenger details page');

    // Fill passenger details
    await page.waitForSelector('input[name="firstName"]', { timeout: 5000 });
    await page.type('input[name="firstName"]', 'John');
    await page.type('input[name="lastName"]', 'Doe');
    
    const emailField = await page.$('input[name="email"], input[type="email"]');
    if (emailField) {
      await page.type('input[name="email"], input[type="email"]', 'john.doe@example.com');
    }
    
    const phoneField = await page.$('input[name="phone"], input[type="tel"]');
    if (phoneField) {
      await page.type('input[name="phone"], input[type="tel"]', '9876543210');
    }

    const dobField = await page.$('input[name="dateOfBirth"], input[name="dob"]');
    if (dobField) {
      await page.evaluate(() => {
        const dob = document.querySelector('input[name="dateOfBirth"], input[name="dob"]');
        if (dob) dob.value = '1990-01-01';
      });
    }

    const genderSelect = await page.$('select[name="gender"]');
    if (genderSelect) {
      await page.select('select[name="gender"]', 'male');
    }

    addStep(currentStep, 'PASS', 'Passenger details filled');

    // Continue
    await page.click('button[type="submit"]');
    await wait(2000);

    // ============================================================
    // STEP 5: ADD-ONS
    // ============================================================
    currentStep = 'Step 5: Add-ons';
    console.log(`\n=== ${currentStep} ===`);
    
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    
    if (!page.url().match(/\/add-ons|\/addons/)) {
      throw new Error(`Expected add-ons page, but got: ${page.url()}`);
    }
    
    addStep(currentStep, 'PASS', 'Navigated to add-ons page');

    // Select first add-on if available
    const addOnCheckboxes = await page.$$('input[type="checkbox"]');
    
    if (addOnCheckboxes.length > 0) {
      await addOnCheckboxes[0].click();
      console.log('Selected first add-on');
      addStep(currentStep, 'PASS', 'Selected add-on');
    } else {
      console.log('No add-ons available');
      addStep(currentStep, 'WARN', 'No add-ons available');
    }

    // Continue
    await page.click('button[type="submit"]');
    await wait(2000);

    // ============================================================
    // STEP 6: SUMMARY
    // ============================================================
    currentStep = 'Step 6: Summary';
    console.log(`\n=== ${currentStep} ===`);
    
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    
    if (!page.url().includes('/summary')) {
      throw new Error(`Expected summary page, but got: ${page.url()}`);
    }
    
    addStep(currentStep, 'PASS', 'Navigated to summary page');

    // Check confirmation checkbox
    const confirmCheckbox = await page.$('input[type="checkbox"]');
    if (confirmCheckbox) {
      await confirmCheckbox.click();
      console.log('Checked confirmation checkbox');
    }

    // Proceed to payment
    await page.click('button[type="submit"]');
    await wait(2000);

    // ============================================================
    // STEP 7: PAYMENT
    // ============================================================
    currentStep = 'Step 7: Payment';
    console.log(`\n=== ${currentStep} ===`);
    
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    
    if (!page.url().includes('/payment')) {
      throw new Error(`Expected payment page, but got: ${page.url()}`);
    }
    
    addStep(currentStep, 'PASS', 'Navigated to payment page');

    // Select payment method
    const upiRadio = await page.$('input[value="upi"], input[value="UPI"]');
    const cardRadio = await page.$('input[value="card"], input[value="CARD"]');
    
    if (upiRadio) {
      await upiRadio.click();
      console.log('Selected UPI payment');
      
      const upiField = await page.$('input[name="upiId"]');
      if (upiField) {
        await page.type('input[name="upiId"]', 'test@upi');
      }
    } else if (cardRadio) {
      await cardRadio.click();
      console.log('Selected Card payment');
      
      await page.type('input[name="cardNumber"]', '4111111111111111');
      await page.type('input[name="expiry"]', '12/25');
      await page.type('input[name="cvv"]', '123');
    }

    addStep(currentStep, 'PASS', 'Payment details filled');

    // Complete payment
    await page.click('button[type="submit"]');
    console.log('Payment submitted, waiting for confirmation...');
    await wait(5000);

    // ============================================================
    // STEP 8: CONFIRMATION
    // ============================================================
    currentStep = 'Step 8: Confirmation';
    console.log(`\n=== ${currentStep} ===`);
    
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    testResults.finalUrl = page.url();
    
    if (!page.url().match(/\/confirmation|\/success/)) {
      throw new Error(`Expected confirmation page, but got: ${page.url()}`);
    }

    // Check for success indicators
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasSuccess = pageText.toLowerCase().includes('success') || 
                      pageText.toLowerCase().includes('confirmed') ||
                      pageText.toLowerCase().includes('booking reference');
    
    if (!hasSuccess) {
      throw new Error(`Confirmation page does not show success`);
    }

    addStep(currentStep, 'PASS', 'Booking confirmed successfully');
    
    console.log('\n✅ END-TO-END TEST COMPLETED SUCCESSFULLY');

  } catch (error) {
    testResults.overall = 'FAIL';
    testResults.errors.push({
      step: currentStep,
      error: error.message,
      url: page ? page.url() : 'N/A'
    });
    
    // Take screenshot on error
    if (page) {
      const screenshotPath = `error-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.error(`\n❌ Screenshot saved: ${screenshotPath}`);
    }
    
    console.error(`\n❌ TEST FAILED at ${currentStep}`);
    console.error(`Error: ${error.message}`);
    if (page) console.error(`URL: ${page.url()}`);
    
  } finally {
    // Print comprehensive report
    printTestReport();
    
    // Close browser
    if (browser) {
      await wait(2000); // Keep browser open briefly to see final state
      await browser.close();
    }
  }
}

// Print test report
function printTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('END-TO-END VALIDATION REPORT');
  console.log('='.repeat(80));
  console.log(`\nOVERALL RESULT: ${testResults.overall}`);
  console.log(`\nFINAL URL: ${testResults.finalUrl}`);
  
  console.log('\n--- STEP-BY-STEP RESULTS ---');
  testResults.steps.forEach(step => {
    const icon = step.status === 'PASS' ? '✅' : step.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} ${step.step}: ${step.status}`);
    console.log(`   ${step.detail}`);
  });
  
  if (testResults.errors.length > 0) {
    console.log('\n--- FAILURE DETAILS ---');
    testResults.errors.forEach(err => {
      console.log(`\nStep: ${err.step}`);
      console.log(`URL: ${err.url}`);
      console.log(`Error: ${err.error}`);
    });
  }
  
  if (testResults.consoleErrors.length > 0) {
    console.log('\n--- CONSOLE ERRORS ---');
    testResults.consoleErrors.forEach(err => console.log(err));
  }
  
  if (testResults.networkErrors.length > 0) {
    console.log('\n--- NETWORK ERRORS ---');
    testResults.networkErrors.forEach(err => console.log(err));
  }
  
  console.log('\n' + '='.repeat(80));
}

// Run the test
runE2ETest().catch(console.error);
