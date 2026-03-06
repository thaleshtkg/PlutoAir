const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';
const uniqueId = Date.now();

test('UI flow: login -> search -> select -> addons -> payment checkout', async ({ page }) => {
  const consoleErrors = [];
  const networkErrors = [];
  const steps = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('requestfailed', (req) => {
    networkErrors.push(`${req.method()} ${req.url()} :: ${req.failure()?.errorText}`);
  });

  // 1) Register + auto-login (avoids guest-limit instability)
  const email = `pw_${uniqueId}@example.com`;
  const password = 'TestPass@123';
  await page.goto(`${BASE_URL}/register`);
  await page.getByTestId('register-fullname-input').fill('Playwright User');
  await page.getByTestId('register-email-input').fill(email);
  await page.getByTestId('register-mobile-input').fill('9876543210');
  await page.getByTestId('register-password-input').fill(password);
  await page.getByTestId('register-confirm-password-input').fill(password);
  await page.getByTestId('register-terms-checkbox').check();
  await page.getByTestId('register-submit-button').click();

  await page.waitForTimeout(1200);
  if (page.url().includes('/login')) {
    await page.getByTestId('login-username-input').fill(email);
    await page.getByTestId('login-password-input').fill(password);
    await page.getByTestId('login-button-signin').click();
  }

  await page.waitForURL(/\/search/, { timeout: 30000 });
  steps.push('PASS: login');

  const selectCity = async (inputTestId, cityName) => {
    const input = page.getByTestId(inputTestId);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await input.fill(cityName);
      await page.waitForTimeout(600);
      const option = page.locator('button').filter({ hasText: cityName }).first();
      if (await option.isVisible().catch(() => false)) {
        await option.click();
        return;
      }
      await input.clear();
      await page.waitForTimeout(300);
    }
    throw new Error(`City option not found for: ${cityName}`);
  };

  // 2) Search
  await selectCity('search-origin-input', 'New Delhi');
  await selectCity('search-destination-input', 'Mumbai');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await page.getByTestId('search-traveldate-input').fill(tomorrow.toISOString().slice(0, 10));
  await page.getByTestId('search-button-submit').click();
  await page.waitForURL(/\/results/);
  steps.push('PASS: search');

  // 3) Select flight
  await page.locator('button', { hasText: /^Select$/ }).first().click();
  await page.getByTestId('results-continue-button').click();
  await page.waitForURL(/\/passengers/);
  steps.push('PASS: select flight');

  // 4) Passenger details (required for next steps)
  await page.getByTestId('passenger-0-firstname').fill('John');
  await page.getByTestId('passenger-0-lastname').fill('Doe');
  await page.getByTestId('passenger-0-dob').fill('1990-01-01');
  await page.getByTestId('passenger-0-gender').selectOption('Male');
  await page.getByTestId('passenger-0-nationality').selectOption('India');
  await page.getByTestId('passengers-continue-button').click();
  await page.waitForURL(/\/addons/);
  steps.push('PASS: passenger details');

  // 5) Add-ons
  await page.locator('button', { hasText: 'Vegetarian Meal' }).first().click();
  await page.getByTestId('addons-continue-button').click();
  await page.waitForURL(/\/summary/);
  steps.push('PASS: add-ons');

  // 6) Summary -> payment
  await page.getByTestId('summary-confirm-checkbox').check();
  await page.getByTestId('summary-confirm-pay-button').click();
  await page.waitForURL(/\/payment/);
  steps.push('PASS: summary');

  // 7) Payment checkout (UPI)
  await page.getByTestId('payment-method-upi').click();
  await page.getByTestId('payment-upi-id').fill('testpay@ybl');
  await page.getByTestId('payment-submit-button').click();
  steps.push('PASS: payment submit');

  // Expect confirmation route, otherwise fail with current location.
  await page.waitForTimeout(9000);
  const finalUrl = page.url();
  expect(finalUrl, `Expected confirmation page, got ${finalUrl}`).toMatch(/\/confirmation\//);

  console.log('Steps:', steps);
  console.log('Final URL:', finalUrl);
  if (consoleErrors.length) console.log('Console errors:', consoleErrors);
  if (networkErrors.length) console.log('Network errors:', networkErrors);
});
