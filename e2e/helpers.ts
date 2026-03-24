import { type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Test account credentials + profile data
// ---------------------------------------------------------------------------

export const TEST_CLIENT = {
  email: 'test-client@glaze.test',
  password: 'testpass123',
  name: 'Test Client',
  role: 'client' as const,
};

export const TEST_FREELANCER = {
  email: 'test-freelancer@glaze.test',
  password: 'testpass123',
  name: 'Test Freelancer',
  role: 'freelancer' as const,
  category: 'Photography',
  service: 'Photography',
};

// ---------------------------------------------------------------------------
// Login helper — fills the login form and waits for redirect.
// Throws a descriptive error if the login form shows an error, so test
// output explains "account not seeded" rather than a cryptic timeout.
// ---------------------------------------------------------------------------

export async function loginAs(
  page: Page,
  credentials: { email: string; password: string },
) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  const errorLocator = page.locator('.text-destructive');
  const navPromise = page.waitForURL(
    (url) => !url.pathname.startsWith('/login'),
    { timeout: 10_000 },
  );

  // Race: navigation succeeds, OR an inline error appears first
  await Promise.race([
    navPromise,
    errorLocator.waitFor({ state: 'visible', timeout: 10_000 }).then(async () => {
      const msg = await errorLocator.first().textContent();
      throw new Error(
        `Login failed for ${credentials.email}: "${msg}"\n` +
          'Run "npx tsx e2e/seed.ts" to provision test accounts in Supabase.',
      );
    }),
  ]);
}
