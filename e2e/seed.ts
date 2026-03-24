/**
 * e2e/seed.ts — provision E2E test accounts in Supabase
 *
 * Run once before the first test run (or whenever accounts are wiped):
 *   npx tsx e2e/seed.ts
 *
 * Required env vars (add to .env.local):
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role_secret_key>
 *
 * The service role key is in Supabase Dashboard > Settings > API.
 * It is NOT the anon key — keep it out of git and client-side code.
 */

import { createClient } from '@supabase/supabase-js';
import { TEST_CLIENT, TEST_FREELANCER } from './helpers';

// Load .env.local manually (tsx doesn't auto-load it)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const raw = readFileSync(envPath, 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      process.env[key] ??= val;
    }
  } catch {
    // .env.local may not exist in CI — rely on process.env directly
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing env vars. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local',
  );
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function upsertUser(
  email: string,
  password: string,
  role: 'client' | 'freelancer',
  name: string,
) {
  // Check if user already exists
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing?.users.find((u) => u.email === email);

  let userId: string;

  if (found) {
    console.log(`  ✓ Auth user already exists: ${email}`);
    userId = found.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, full_name: name },
    });
    if (error) throw new Error(`Failed to create ${email}: ${error.message}`);
    userId = data.user.id;
    console.log(`  + Created auth user: ${email} (${userId})`);
  }

  // Upsert profile row
  const profileBase = {
    id: userId,
    role,
    full_name: name,
    is_public: true,
  };

  const { error: profileErr } = await admin
    .from('profiles')
    .upsert(profileBase, { onConflict: 'id' });

  if (profileErr) throw new Error(`Failed to upsert profile for ${email}: ${profileErr.message}`);
  console.log(`  ✓ Profile row upserted for ${email}`);

  return userId;
}

async function seed() {
  console.log('\nSeeding E2E test accounts...\n');

  // --- Client ---
  await upsertUser(
    TEST_CLIENT.email,
    TEST_CLIENT.password,
    TEST_CLIENT.role,
    TEST_CLIENT.name,
  );

  // --- Freelancer ---
  const freelancerId = await upsertUser(
    TEST_FREELANCER.email,
    TEST_FREELANCER.password,
    TEST_FREELANCER.role,
    TEST_FREELANCER.name,
  );

  // Upsert a freelancer profile with category
  const { error: catErr } = await admin
    .from('profiles')
    .update({ category: TEST_FREELANCER.category })
    .eq('id', freelancerId);
  if (catErr) throw new Error(`Failed to set category: ${catErr.message}`);

  // Upsert at least one service for the freelancer
  const { data: existingServices } = await admin
    .from('freelancer_services')
    .select('id')
    .eq('freelancer_id', freelancerId)
    .eq('service_name', TEST_FREELANCER.service);

  if (!existingServices?.length) {
    const { error: svcErr } = await admin
      .from('freelancer_services')
      .insert({ freelancer_id: freelancerId, service_name: TEST_FREELANCER.service });
    if (svcErr) throw new Error(`Failed to insert service: ${svcErr.message}`);
    console.log(`  + Added service "${TEST_FREELANCER.service}" for ${TEST_FREELANCER.email}`);
  } else {
    console.log(`  ✓ Service already exists for ${TEST_FREELANCER.email}`);
  }

  console.log('\nSeed complete. You can now run: npx playwright test\n');
}

seed().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
