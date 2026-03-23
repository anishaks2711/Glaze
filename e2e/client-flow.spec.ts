import { test, expect } from '@playwright/test';
import { loginAs, TEST_CLIENT } from './helpers';

// ---------------------------------------------------------------------------
// Complete client path
// NOTE: The "client signup" test creates a one-off account each run using a
// timestamp-based email so it never collides with an existing user.
// ---------------------------------------------------------------------------

test.describe('Client Flow', () => {
  test('client signup goes to homepage, not onboarding', async ({ page }) => {
    const email = `e2e-client-${Date.now()}@glaze.test`;

    await page.goto('/signup');

    // Fill in the form
    await page.getByLabel('Full name').fill('E2E Client');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');

    // Select the "I'm a Client" role card
    await page.getByRole('button', { name: /I'm a Client/i }).click();

    await page.getByRole('button', { name: /create account/i }).click();

    // Should land on '/', NOT '/onboard'
    await page.waitForURL('/', { timeout: 15_000 });
    await expect(page).toHaveURL('/');

    // Onboarding wizard elements must NOT be visible
    await expect(page.getByText(/profile basics/i)).not.toBeVisible();
    await expect(page.getByText(/step 1 of 7/i)).not.toBeVisible();
  });

  test('client can browse freelancers without being redirected to /onboard', async ({ page }) => {
    await loginAs(page, TEST_CLIENT);

    // Must stay on '/'
    await expect(page).toHaveURL('/');

    // Onboarding card must NOT appear
    await expect(page.getByText(/profile basics/i)).not.toBeVisible();
  });

  test('client visiting /onboard is redirected to home', async ({ page }) => {
    await loginAs(page, TEST_CLIENT);
    await page.goto('/onboard');
    // RoleRoute redirects clients away from /onboard
    await expect(page).toHaveURL('/');
  });

  test('homepage shows freelancer grid to a logged-in client', async ({ page }) => {
    await loginAs(page, TEST_CLIENT);
    await page.goto('/');

    // The browse section heading is always rendered
    await expect(
      page.getByRole('heading', { name: /all freelancers/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
