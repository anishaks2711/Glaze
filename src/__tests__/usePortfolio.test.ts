import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePortfolio } from '@/hooks/usePortfolio';

function makeBuilder(resolveValue: unknown) {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn().mockReturnValue(builder);
  builder.insert = vi.fn().mockReturnValue(builder);
  builder.delete = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.order = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue(resolveValue);
  (builder as { then: (r: (v: unknown) => unknown, j?: (e: unknown) => unknown) => Promise<unknown> }).then =
    (resolve, reject) => Promise.resolve(resolveValue).then(resolve, reject);
  return builder;
}

const { mockFrom, mockStorageFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockStorageFrom: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    storage: { from: mockStorageFrom },
  },
}));

describe('usePortfolio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageFrom.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } }),
    });
  });

  it('fetches portfolio by freelancer_id on mount', async () => {
    const builder = makeBuilder({ data: [], error: null });
    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(() => usePortfolio('freelancer-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFrom).toHaveBeenCalledWith('freelancer_portfolio');
    expect(builder.select).toHaveBeenCalledWith('id, image_url, caption, display_order');
    expect(builder.eq).toHaveBeenCalledWith('freelancer_id', 'freelancer-1');
    expect(builder.order).toHaveBeenCalledWith('display_order');
  });

  it('returns empty portfolio when no data', async () => {
    const builder = makeBuilder({ data: [], error: null });
    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(() => usePortfolio('freelancer-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.portfolio).toHaveLength(0);
  });

  it('addPhoto uploads to storage and inserts row into DB', async () => {
    const fetchBuilder = makeBuilder({ data: [], error: null });
    const insertBuilder = makeBuilder({
      data: { id: 'photo-1', image_url: 'https://example.com/photo.jpg', caption: null, display_order: 0 },
      error: null,
    });
    mockFrom
      .mockReturnValueOnce(fetchBuilder)
      .mockReturnValueOnce(insertBuilder);

    const { result } = renderHook(() => usePortfolio('freelancer-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
    let err: string | null = 'not-called';
    await act(async () => {
      err = await result.current.addPhoto(file, null, 0);
    });

    expect(err).toBeNull();
    expect(mockStorageFrom).toHaveBeenCalledWith('portfolio-media');
    expect(insertBuilder.insert).toHaveBeenCalled();
    expect(result.current.portfolio).toHaveLength(1);
  });

  it('addPhoto returns error when not authenticated', async () => {
    const { result } = renderHook(() => usePortfolio(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let err: string | null = null;
    await act(async () => {
      err = await result.current.addPhoto(new File([''], 'photo.jpg', { type: 'image/jpeg' }), null);
    });

    expect(err).toBe('Not authenticated');
  });

  it('deletePhoto removes item from DB and local state', async () => {
    const fetchBuilder = makeBuilder({
      data: [{ id: 'photo-1', image_url: 'https://example.com/photo.jpg', caption: null, display_order: 0 }],
      error: null,
    });
    const deleteBuilder = makeBuilder({ error: null });
    mockFrom
      .mockReturnValueOnce(fetchBuilder)
      .mockReturnValueOnce(deleteBuilder);

    const { result } = renderHook(() => usePortfolio('freelancer-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.portfolio).toHaveLength(1);

    await act(async () => {
      await result.current.deletePhoto('photo-1');
    });

    expect(deleteBuilder.delete).toHaveBeenCalled();
    expect(deleteBuilder.eq).toHaveBeenCalledWith('id', 'photo-1');
    expect(result.current.portfolio).toHaveLength(0);
  });
});
