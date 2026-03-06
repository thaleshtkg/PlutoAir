const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000';

const unique = Date.now();
const regUser = {
  fullName: 'Journey User',
  email: `journey_${unique}@example.com`,
  password: 'TestPass@123',
  mobile: '9876543210',
};

const regUser2 = {
  fullName: 'Journey User Two',
  email: `journey2_${unique}@example.com`,
  password: 'TestPass@123',
  mobile: '9876543211',
};

async function selectCity(page, inputTestId, cityName) {
  const input = page.getByTestId(inputTestId);
  for (let i = 0; i < 4; i += 1) {
    await input.fill(cityName);
    await page.waitForTimeout(500);
    const option = page.locator('button').filter({ hasText: cityName }).first();
    if (await option.isVisible().catch(() => false)) {
      await option.click();
      return;
    }
    await input.clear();
    await page.waitForTimeout(250);
  }
  throw new Error(`City selection failed for ${cityName}`);
}

async function runBookingFlow(page) {
  await page.waitForURL(/\/search/, { timeout: 30000 });

  await selectCity(page, 'search-origin-input', 'New Delhi');
  await selectCity(page, 'search-destination-input', 'Mumbai');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await page.getByTestId('search-traveldate-input').fill(tomorrow.toISOString().slice(0, 10));
  await page.getByTestId('search-button-submit').click();

  await page.waitForURL(/\/results/, { timeout: 30000 });
  await page.locator('button', { hasText: /^Select$/ }).first().click();
  await page.getByTestId('results-continue-button').click();

  await page.waitForURL(/\/passengers/, { timeout: 30000 });
  await page.getByTestId('passenger-0-firstname').fill('John');
  await page.getByTestId('passenger-0-lastname').fill('Doe');
  await page.getByTestId('passenger-0-dob').fill('1990-01-01');
  await page.getByTestId('passenger-0-gender').selectOption('Male');
  await page.getByTestId('passenger-0-nationality').selectOption('India');
  await page.getByTestId('passengers-continue-button').click();

  await page.waitForURL(/\/addons/, { timeout: 30000 });
  await page.locator('button', { hasText: 'Vegetarian Meal' }).first().click();
  await page.getByTestId('addons-continue-button').click();

  await page.waitForURL(/\/summary/, { timeout: 30000 });
  await page.getByTestId('summary-confirm-checkbox').check();
  await page.getByTestId('summary-confirm-pay-button').click();

  await page.waitForURL(/\/payment/, { timeout: 30000 });
  // Validate fixed card behavior with 16 digits.
  await page.getByTestId('payment-method-credit_card').click();
  await page.getByTestId('payment-card-number').fill('5345 3454 3555 5656');
  await page.getByTestId('payment-card-expiry').fill('12/30');
  await page.getByTestId('payment-card-cvv').fill('123');
  await page.getByTestId('payment-card-name').fill('JOHN DOE');
  await expect(page.getByText('Enter a valid 16-digit card number')).toHaveCount(0);
  await page.getByTestId('payment-submit-button').click();

  await page.waitForURL(/\/confirmation\//, { timeout: 40000 });
}

test.describe.serial('Auth variants with full E2E booking', () => {
  test('default admin login -> full e2e flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId('login-username-input').fill('admin');
    await page.getByTestId('login-password-input').fill('admin@123');
    await page.getByTestId('login-button-signin').click();
    await runBookingFlow(page);
  });

  test('registered user login -> full e2e flow', async ({ page, request }) => {
    await request.post(`${API_URL}/api/auth/register`, {
      data: {
        full_name: regUser.fullName,
        email: regUser.email,
        mobile: regUser.mobile,
        password: regUser.password,
      },
    });

    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId('login-username-input').fill(regUser.email);
    await page.getByTestId('login-password-input').fill(regUser.password);
    await page.getByTestId('login-button-signin').click();
    await runBookingFlow(page);
  });

  test('register -> logout -> login same user -> full e2e flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.getByTestId('register-fullname-input').fill(regUser2.fullName);
    await page.getByTestId('register-email-input').fill(regUser2.email);
    await page.getByTestId('register-mobile-input').fill(regUser2.mobile);
    await page.getByTestId('register-password-input').fill(regUser2.password);
    await page.getByTestId('register-confirm-password-input').fill(regUser2.password);
    await page.getByTestId('register-terms-checkbox').check();
    await page.getByTestId('register-submit-button').click();
    await page.waitForURL(/\/search/, { timeout: 30000 });

    await page.getByTestId('header-button-logout').click();
    await page.getByTestId('logout-modal-confirm').click();
    await page.waitForURL(/\/login/, { timeout: 30000 });

    await page.getByTestId('login-username-input').fill(regUser2.email);
    await page.getByTestId('login-password-input').fill(regUser2.password);
    await page.getByTestId('login-button-signin').click();
    await runBookingFlow(page);
  });
});
