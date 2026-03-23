import { test, expect } from '@playwright/test';
import { TEST_FREELANCER, loginAs } from './helpers';

// ---------------------------------------------------------------------------
// Complete freelancer path
// ---------------------------------------------------------------------------

test.describe('Freelancer Flow', () => {
  test('freelancer signup goes to /onboard', async ({ page }) => {
    const email = `e2e-freelancer-${Date.now()}@glaze.test`;

    await page.goto('/signup');

    await page.getByLabel('Full name').fill('E2E Freelancer');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');

    // Select the "I'm a Freelancer" role card
    await page.getByRole('button', { name: /I'm a Freelancer/i }).click();

    await page.getByRole('button', { name: /create account/i }).click();

    // Should land on /onboard
    await page.waitForURL('/onboard', { timeout: 15_000 });
    await expect(page).toHaveURL('/onboard');

    // Step 1 "Profile Basics" heading must be visible
    await expect(page.getByText('Profile Basics')).toBeVisible();
    await expect(page.getByText(/step 1 of 7/i)).toBeVisible();
  });

  test('incomplete freelancer (auth but no profile row) is redirected to /onboard', async ({
    page,
  }) => {
    // TEST_FREELANCER account has a profile row. This test uses a freshly
    // created user (no profile row exists yet) to verify the guard.
    const email = `e2e-incomplete-${Date.now()}@glaze.test`;

    await page.goto('/signup');
    await page.getByLabel('Full name').fill('Incomplete FL');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');
    await page.getByRole('button', { name: /I'm a Freelancer/i }).click();
    await page.getByRole('button', { name: /create account/i }).click();

    // After signup they're already on /onboard — navigate away to /
    await page.waitForURL('/onboard', { timeout: 15_000 });
    await page.goto('/');

    // IncompleteProfileGuard should redirect back to /onboard
    await expect(page).toHaveURL('/onboard');
  });

  test('onboarding page shows 7-step progress bar', async ({ page }) => {
    // Use a fresh throwaway account so we always start at step 1
    const email = `e2e-steps-${Date.now()}@glaze.test`;

    await page.goto('/signup');
    await page.getByLabel('Full name').fill('Steps Tester');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');
    await page.getByRole('button', { name: /I'm a Freelancer/i }).click();
    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForURL('/onboard', { timeout: 15_000 });

    // Progress bar: 7 segment divs with rounded-full class
    const segments = page.locator('.rounded-full.flex-1');
    await expect(segments).toHaveCount(7);
  });

  test('existing freelancer with profile logs in and lands on homepage', async ({ page }) => {
    await loginAs(page, TEST_FREELANCER);
    // A freelancer with a completed profile goes to '/', not /onboard
    await expect(page).toHaveURL('/');
  });
});
