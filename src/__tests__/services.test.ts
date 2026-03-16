import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useServices } from '@/hooks/useServices';

// Chainable mock builder that resolves to `resolveValue`
function makeBuilder(resolveValue: unknown) {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn().mockReturnValue(builder);
  builder.insert = vi.fn().mockReturnValue(builder);
  builder.delete = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.order = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue(resolveValue);
  // Make builder thenable for `.then()` calls in useEffect
  (builder as { then: (r: (v: unknown) => unknown, j?: (e: unknown) => unknown) => Promise<unknown> }).then =
    (resolve, reject) => Promise.resolve(resolveValue).then(resolve, reject);
  return builder;
}

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

describe('useServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchServices calls select filtered by freelancer_id on mount', async () => {
    const builder = makeBuilder({ data: [], error: null });
    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(() => useServices('freelancer-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFrom).toHaveBeenCalledWith('freelancer_services');
    expect(builder.select).toHaveBeenCalledWith('id, service_name');
    expect(builder.eq).toHaveBeenCalledWith('freelancer_id', 'freelancer-1');
    expect(builder.order).toHaveBeenCalledWith('created_at');
  });

  it('addService calls insert with correct shape', async () => {
    const fetchBuilder = makeBuilder({ data: [], error: null });
    const insertBuilder = makeBuilder({
      data: { id: 'new-id', service_name: 'Photography' },
      error: null,
    });

    mockFrom
      .mockReturnValueOnce(fetchBuilder)   // useEffect fetch
      .mockReturnValueOnce(insertBuilder); // addService insert

    const { result } = renderHook(() => useServices('freelancer-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addService('Photography');
    });

    expect(insertBuilder.insert).toHaveBeenCalledWith({
      freelancer_id: 'freelancer-1',
      service_name: 'Photography',
    });
  });

  it('addService validates input before inserting — rejects invalid name without hitting DB', async () => {
    const builder = makeBuilder({ data: [], error: null });
    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(() => useServices('freelancer-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.clearAllMocks(); // reset call counts after initial fetch

    let error: string | null = null;
    await act(async () => {
      error = await result.current.addService('!'); // invalid: no letters, too short
    });

    expect(error).not.toBeNull();
    expect(mockFrom).not.toHaveBeenCalled(); // DB never called
  });

  it('removeService calls delete with correct id', async () => {
    const fetchBuilder = makeBuilder({
      data: [{ id: 'svc-1', service_name: 'Photography' }],
      error: null,
    });
    const deleteBuilder = makeBuilder({ error: null });

    mockFrom
      .mockReturnValueOnce(fetchBuilder)   // useEffect fetch
      .mockReturnValueOnce(deleteBuilder); // removeService delete

    const { result } = renderHook(() => useServices('freelancer-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removeService('svc-1');
    });

    expect(deleteBuilder.delete).toHaveBeenCalled();
    expect(deleteBuilder.eq).toHaveBeenCalledWith('id', 'svc-1');
  });
});
