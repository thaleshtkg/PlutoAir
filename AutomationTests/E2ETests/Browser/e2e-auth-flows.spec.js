import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const uniqueId = Date.now();
const registeredUser = {
  fullName: 'Playwright Auth User',
  email: `auth_${uniqueId}@example.com`,
  password: 'TestPass@123',
  mobile: '9876543210',
};

test.describe.serial('Chrome UI auth scenarios', () => {
  test('1) Login with default admin credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId('login-username-input').fill('admin');
    await page.getByTestId('login-password-input').fill('admin@123');
    await page.getByTestId('login-button-signin').click();
    await page.waitForURL(/\/search/, { timeout: 30000 });
    expect(page.url()).toContain('/search');
  });

  test('2) Registration only flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.getByTestId('register-fullname-input').fill(registeredUser.fullName);
    await page.getByTestId('register-email-input').fill(registeredUser.email);
    await page.getByTestId('register-mobile-input').fill(registeredUser.mobile);
    await page.getByTestId('register-password-input').fill(registeredUser.password);
    await page.getByTestId('register-confirm-password-input').fill(registeredUser.password);
    await page.getByTestId('register-terms-checkbox').check();
    await page.getByTestId('register-submit-button').click();

    // Current app auto-logs in after register.
    await page.waitForURL(/\/search/, { timeout: 30000 });
    expect(page.url()).toContain('/search');
  });

  test('3) Login with newly registered user', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId('login-username-input').fill(registeredUser.email);
    await page.getByTestId('login-password-input').fill(registeredUser.password);
    await page.getByTestId('login-button-signin').click();
    await page.waitForURL(/\/search/, { timeout: 30000 });
    expect(page.url()).toContain('/search');
  });
});
