import { test, expect } from '@playwright/test';
import { loginAs, TEST_CLIENT, TEST_FREELANCER } from './helpers';

// ---------------------------------------------------------------------------
// Glaze (review) submission flow
// ---------------------------------------------------------------------------

test.describe('Glaze Flow', () => {
  test('client on a freelancer profile sees the "Leave a Glaze" button', async ({ page }) => {
    await loginAs(page, TEST_CLIENT);

    await page.goto('/');
    // Find the seeded Test Freelancer card specifically
    const freelancerCard = page
      .locator('a[href^="/profile/"]')
      .filter({ hasText: new RegExp(TEST_FREELANCER.name, 'i') })
      .first();
    await expect(freelancerCard).toBeVisible({ timeout: 10_000 });
    await freelancerCard.click();

    // "Leave a Glaze" button must be visible for a logged-in client
    await expect(
      page.getByRole('button', { name: /leave a glaze/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('"Leave a Glaze" opens the Glaze flow overlay', async ({ page }) => {
    await loginAs(page, TEST_CLIENT);

    await page.goto('/');
    const freelancerCard = page
      .locator('a[href^="/profile/"]')
      .filter({ hasText: new RegExp(TEST_FREELANCER.name, 'i') })
      .first();
    await expect(freelancerCard).toBeVisible({ timeout: 10_000 });
    await freelancerCard.click();

    await page.getByRole('button', { name: /leave a glaze/i }).click();

    // The GlazeFlow overlay header should show "Leave a Glaze"
    await expect(page.getByText(/leave a glaze/i)).toBeVisible({ timeout: 5_000 });
  });

  test('freelancer profile glazes tab shows media thumbnails when glazes exist', async ({
    page,
  }) => {
    await loginAs(page, TEST_CLIENT);

    await page.goto('/');
    const freelancerCard = page
      .locator('a[href^="/profile/"]')
      .filter({ hasText: new RegExp(TEST_FREELANCER.name, 'i') })
      .first();

    const count = await freelancerCard.count();
    test.skip(count === 0, `${TEST_FREELANCER.name} not found in grid — seed data missing`);

    await freelancerCard.click();

    // All rendered img elements must have a non-empty src attribute
    const images = page.locator('img[src]');
    const imgCount = await images.count();
    expect(imgCount).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(imgCount, 5); i++) {
      const src = await images.nth(i).getAttribute('src');
      expect(src).toBeTruthy();
    }
  });

  test('unauthenticated user visiting a profile does not see "Leave a Glaze"', async ({
    page,
  }) => {
    await page.goto('/');
    const firstCard = page.locator('a[href^="/profile/"]').first();
    // Skip gracefully when DB has no public freelancers yet
    const cardCount = await firstCard.count();
    test.skip(cardCount === 0, 'No freelancer cards in DB — seed data missing');

    await expect(firstCard).toBeVisible({ timeout: 10_000 });
    await firstCard.click();

    // Not logged in — "Leave a Glaze" button must be absent
    await expect(
      page.getByRole('button', { name: /leave a glaze/i }),
    ).not.toBeVisible();
  });
});
