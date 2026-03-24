import { test, expect } from '@playwright/test';
import { loginAs, TEST_CLIENT } from './helpers';

// ---------------------------------------------------------------------------
// Route protection: unauthenticated and authenticated guard behaviour
// ---------------------------------------------------------------------------

test.describe('Auth Guards', () => {
  test('unauthenticated user visiting /onboard is redirected to /login', async ({ page }) => {
    await page.goto('/onboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user can browse the homepage without being redirected', async ({ page }) => {
    await page.goto('/');
    // Should stay on '/' and show at minimum the page header
    await expect(page).toHaveURL('/');
    // The Glaze header is always rendered
    await expect(page.locator('h1', { hasText: /glaze/i }).first()).toBeVisible();
  });

  test('logged-in user visiting /login is redirected to home', async ({ page }) => {
    await loginAs(page, TEST_CLIENT);
    // Now navigate back to /login — GuestRoute should redirect away
    await page.goto('/login');
    await expect(page).toHaveURL('/');
  });

  test('logged-in user visiting /signup is redirected to home', async ({ page }) => {
    await loginAs(page, TEST_CLIENT);
    await page.goto('/signup');
    await expect(page).toHaveURL('/');
  });
});
