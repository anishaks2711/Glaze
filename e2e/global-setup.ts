/**
 * Playwright global setup — runs once before the full test suite.
 * Delegates to seed.ts to ensure test accounts exist in Supabase.
 */
import { execSync } from 'node:child_process';

export default async function globalSetup() {
  console.log('\n[global-setup] Provisioning E2E test accounts...');
  try {
    execSync('npx tsx e2e/seed.ts', { stdio: 'inherit' });
  } catch (err) {
    // Seed failures should be visible but not block tests that don't need auth
    console.warn('[global-setup] Seed script failed — login-dependent tests will fail.');
    console.warn((err as Error).message);
  }
}
