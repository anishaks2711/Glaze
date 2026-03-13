import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockSupabaseClient = { from: vi.fn(), auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() } };
const mockCreateClient = vi.fn(() => mockSupabaseClient);

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

describe('supabase client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
    mockCreateClient.mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exports a supabase client that is not null', async () => {
    const mod = await import('@/lib/supabase');
    expect(mod.supabase).toBeDefined();
    expect(mod.supabase).not.toBeNull();
  });

  it('initializes with the correct env var values', async () => {
    await import('@/lib/supabase');
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    );
  });
});
