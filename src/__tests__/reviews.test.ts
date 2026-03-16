import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  validateReviewRating,
  validateReviewText,
  validateReviewFile,
  validateReviewVideo,
  validateReviewPhoto,
  validateReviewCaption,
} from '@/lib/validation';
import { useReviews, updateReview, deleteReview } from '@/hooks/useReviews';

// ─── validateReviewRating ──────────────────────────────────────────────────────

describe('validateReviewRating', () => {
  it('rejects 0', () => expect(validateReviewRating(0).valid).toBe(false));
  it('rejects 6', () => expect(validateReviewRating(6).valid).toBe(false));
  it('rejects negative numbers', () => expect(validateReviewRating(-1).valid).toBe(false));
  it('rejects non-integers', () => expect(validateReviewRating(3.5).valid).toBe(false));
  it('accepts 1', () => expect(validateReviewRating(1).valid).toBe(true));
  it('accepts 3', () => expect(validateReviewRating(3).valid).toBe(true));
  it('accepts 5', () => expect(validateReviewRating(5).valid).toBe(true));
});

// ─── validateReviewText ────────────────────────────────────────────────────────

describe('validateReviewText', () => {
  it('accepts empty string', () => expect(validateReviewText('').valid).toBe(true));
  it('accepts text under 500 chars', () => expect(validateReviewText('Great work!').valid).toBe(true));
  it('accepts exactly 500 chars', () => expect(validateReviewText('a'.repeat(500)).valid).toBe(true));
  it('rejects text over 500 chars', () => expect(validateReviewText('a'.repeat(501)).valid).toBe(false));
});

// ─── validateReviewFile (legacy, accepts image or video, 50MB) ────────────────

describe('validateReviewFile', () => {
  it('accepts valid image file', () => {
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    expect(validateReviewFile(file).valid).toBe(true);
  });
  it('accepts valid video file', () => {
    const file = new File(['data'], 'clip.mp4', { type: 'video/mp4' });
    expect(validateReviewFile(file).valid).toBe(true);
  });
  it('rejects non-media file', () => {
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    expect(validateReviewFile(file).valid).toBe(false);
  });
  it('rejects file over 50MB', () => {
    const bigFile = new File([new ArrayBuffer(51 * 1024 * 1024)], 'big.mp4', { type: 'video/mp4' });
    Object.defineProperty(bigFile, 'size', { value: 51 * 1024 * 1024 });
    expect(validateReviewFile(bigFile).valid).toBe(false);
  });
  it('accepts file exactly at 50MB', () => {
    const file = new File(['data'], 'video.mp4', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 });
    expect(validateReviewFile(file).valid).toBe(true);
  });
});

// ─── validateReviewVideo ───────────────────────────────────────────────────────

describe('validateReviewVideo', () => {
  it('accepts null (not required)', () => expect(validateReviewVideo(null).valid).toBe(true));
  it('accepts valid video file', () => {
    const f = new File(['data'], 'clip.mp4', { type: 'video/mp4' });
    expect(validateReviewVideo(f).valid).toBe(true);
  });
  it('rejects non-video file', () => {
    const f = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    expect(validateReviewVideo(f).valid).toBe(false);
  });
  it('rejects video over 100MB', () => {
    const f = new File(['data'], 'big.mp4', { type: 'video/mp4' });
    Object.defineProperty(f, 'size', { value: 101 * 1024 * 1024 });
    expect(validateReviewVideo(f).valid).toBe(false);
  });
  it('accepts video exactly at 100MB', () => {
    const f = new File(['data'], 'edge.mp4', { type: 'video/mp4' });
    Object.defineProperty(f, 'size', { value: 100 * 1024 * 1024 });
    expect(validateReviewVideo(f).valid).toBe(true);
  });
});

// ─── validateReviewPhoto ───────────────────────────────────────────────────────

describe('validateReviewPhoto', () => {
  it('accepts null (not required)', () => expect(validateReviewPhoto(null).valid).toBe(true));
  it('accepts valid image file', () => {
    const f = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    expect(validateReviewPhoto(f).valid).toBe(true);
  });
  it('rejects non-image file', () => {
    const f = new File(['data'], 'clip.mp4', { type: 'video/mp4' });
    expect(validateReviewPhoto(f).valid).toBe(false);
  });
  it('rejects image over 10MB', () => {
    const f = new File(['data'], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(f, 'size', { value: 11 * 1024 * 1024 });
    expect(validateReviewPhoto(f).valid).toBe(false);
  });
  it('accepts image exactly at 10MB', () => {
    const f = new File(['data'], 'edge.jpg', { type: 'image/jpeg' });
    Object.defineProperty(f, 'size', { value: 10 * 1024 * 1024 });
    expect(validateReviewPhoto(f).valid).toBe(true);
  });
});

// ─── validateReviewCaption ─────────────────────────────────────────────────────

describe('validateReviewCaption', () => {
  it('accepts empty string', () => expect(validateReviewCaption('').valid).toBe(true));
  it('accepts valid caption', () => expect(validateReviewCaption('Amazing work!').valid).toBe(true));
  it('accepts exactly 150 chars', () => expect(validateReviewCaption('a'.repeat(150)).valid).toBe(true));
  it('rejects caption over 150 chars', () => expect(validateReviewCaption('a'.repeat(151)).valid).toBe(false));
});

// ─── useReviews hook ───────────────────────────────────────────────────────────

function makeBuilder(resolveValue: unknown) {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn().mockReturnValue(builder);
  builder.insert = vi.fn().mockReturnValue(builder);
  builder.update = vi.fn().mockReturnValue(builder);
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

function makeStorage(overrides: Record<string, unknown> = {}) {
  return {
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/review.jpg' } }),
    remove: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
}

describe('useReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageFrom.mockReturnValue(makeStorage());
  });

  it('fetches reviews by freelancer_id on mount', async () => {
    const builder = makeBuilder({ data: [], error: null });
    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(() => useReviews('freelancer-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFrom).toHaveBeenCalledWith('reviews');
    expect(builder.eq).toHaveBeenCalledWith('freelancer_id', 'freelancer-1');
  });

  it('submitReview rejects invalid rating without hitting DB', async () => {
    const fetchBuilder = makeBuilder({ data: [], error: null });
    mockFrom.mockReturnValue(fetchBuilder);

    const { result } = renderHook(() => useReviews('freelancer-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.clearAllMocks();

    let err: string | null = null;
    await act(async () => {
      err = await result.current.submitReview({ clientId: 'client-1', rating: 0 });
    });

    expect(err).not.toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('submitReview rejects non-integer rating', async () => {
    const fetchBuilder = makeBuilder({ data: [], error: null });
    mockFrom.mockReturnValue(fetchBuilder);

    const { result } = renderHook(() => useReviews('freelancer-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.clearAllMocks();

    let err: string | null = null;
    await act(async () => {
      err = await result.current.submitReview({ clientId: 'client-1', rating: 3.5 });
    });

    expect(err).not.toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  // Updated: hook now uses validateReviewVideo (100MB limit) via videoFile param
  it('submitReview rejects oversized video without hitting DB', async () => {
    const fetchBuilder = makeBuilder({ data: [], error: null });
    mockFrom.mockReturnValue(fetchBuilder);

    const { result } = renderHook(() => useReviews('freelancer-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.clearAllMocks();

    const bigFile = new File(['data'], 'big.mp4', { type: 'video/mp4' });
    Object.defineProperty(bigFile, 'size', { value: 101 * 1024 * 1024 });

    let err: string | null = null;
    await act(async () => {
      err = await result.current.submitReview({ clientId: 'client-1', rating: 4, videoFile: bigFile });
    });

    expect(err).not.toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockStorageFrom).not.toHaveBeenCalled();
  });

  it('submitReview succeeds with rating only (no video)', async () => {
    const fetchBuilder = makeBuilder({ data: [], error: null });
    const insertBuilder = makeBuilder({
      data: {
        id: 'review-1',
        freelancer_id: 'freelancer-1',
        client_id: 'client-1',
        rating: 5,
        caption: null,
        text_content: 'Amazing!',
        media_url: null,
        media_type: null,
        photo_url: null,
        has_video: false,
        created_at: new Date().toISOString(),
      },
      error: null,
    });

    mockFrom.mockReturnValueOnce(fetchBuilder).mockReturnValueOnce(insertBuilder);

    const { result } = renderHook(() => useReviews('freelancer-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let err: string | null = 'not-called';
    await act(async () => {
      err = await result.current.submitReview({ clientId: 'client-1', rating: 5, textContent: 'Amazing!' });
    });

    expect(err).toBeNull();
    expect(insertBuilder.insert).toHaveBeenCalled();
    expect(result.current.reviews).toHaveLength(1);
  });

  it('submitReview succeeds with rating + video', async () => {
    const fetchBuilder = makeBuilder({ data: [], error: null });
    const insertBuilder = makeBuilder({
      data: {
        id: 'review-2',
        freelancer_id: 'freelancer-1',
        client_id: 'client-1',
        rating: 4,
        caption: null,
        text_content: null,
        media_url: 'https://example.com/video.mp4',
        media_type: 'video',
        photo_url: null,
        has_video: true,
        created_at: new Date().toISOString(),
      },
      error: null,
    });

    mockFrom.mockReturnValueOnce(fetchBuilder).mockReturnValueOnce(insertBuilder);

    const { result } = renderHook(() => useReviews('freelancer-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const videoFile = new File(['data'], 'review.mp4', { type: 'video/mp4' });

    let err: string | null = 'not-called';
    await act(async () => {
      err = await result.current.submitReview({ clientId: 'client-1', rating: 4, videoFile });
    });

    expect(err).toBeNull();
    expect(mockStorageFrom).toHaveBeenCalledWith('review-media');
    expect(result.current.reviews).toHaveLength(1);
    expect(result.current.reviews[0].has_video).toBe(true);
  });
});

// ─── updateReview ──────────────────────────────────────────────────────────────

describe('updateReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageFrom.mockReturnValue(makeStorage());
  });

  it('rejects invalid rating without hitting DB', async () => {
    let err: string | null = null;
    err = await updateReview('review-1', 'freelancer-1', {
      rating: 0, caption: '', textContent: '',
      newVideoFile: null, newPhotoFile: null,
      keepExistingVideo: false, keepExistingPhoto: false,
      currentMediaUrl: null, currentPhotoUrl: null,
    });
    expect(err).not.toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects non-integer rating', async () => {
    let err: string | null = null;
    err = await updateReview('review-1', 'freelancer-1', {
      rating: 2.5, caption: '', textContent: '',
      newVideoFile: null, newPhotoFile: null,
      keepExistingVideo: false, keepExistingPhoto: false,
      currentMediaUrl: null, currentPhotoUrl: null,
    });
    expect(err).not.toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects oversized video without hitting DB', async () => {
    const bigFile = new File(['data'], 'big.mp4', { type: 'video/mp4' });
    Object.defineProperty(bigFile, 'size', { value: 101 * 1024 * 1024 });
    let err: string | null = null;
    err = await updateReview('review-1', 'freelancer-1', {
      rating: 4, caption: '', textContent: '',
      newVideoFile: bigFile, newPhotoFile: null,
      keepExistingVideo: false, keepExistingPhoto: false,
      currentMediaUrl: null, currentPhotoUrl: null,
    });
    expect(err).not.toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockStorageFrom).not.toHaveBeenCalled();
  });

  it('succeeds with text-only update (no media)', async () => {
    const builder = makeBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    const err = await updateReview('review-1', 'freelancer-1', {
      rating: 5, caption: 'Great!', textContent: 'Loved it',
      newVideoFile: null, newPhotoFile: null,
      keepExistingVideo: false, keepExistingPhoto: false,
      currentMediaUrl: null, currentPhotoUrl: null,
    });
    expect(err).toBeNull();
    expect(builder.update).toHaveBeenCalled();
    expect(mockStorageFrom).not.toHaveBeenCalled();
  });

  it('uploads new video and calls storage', async () => {
    const builder = makeBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    const videoFile = new File(['data'], 'new.mp4', { type: 'video/mp4' });
    const err = await updateReview('review-1', 'freelancer-1', {
      rating: 4, caption: '', textContent: '',
      newVideoFile: videoFile, newPhotoFile: null,
      keepExistingVideo: false, keepExistingPhoto: false,
      currentMediaUrl: null, currentPhotoUrl: null,
    });
    expect(err).toBeNull();
    expect(mockStorageFrom).toHaveBeenCalledWith('review-media');
    expect(builder.update).toHaveBeenCalled();
  });

  it('deletes old video from storage when replacing with new one', async () => {
    const storage = makeStorage();
    mockStorageFrom.mockReturnValue(storage);
    const builder = makeBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    const videoFile = new File(['data'], 'new.mp4', { type: 'video/mp4' });
    const err = await updateReview('review-1', 'freelancer-1', {
      rating: 4, caption: '', textContent: '',
      newVideoFile: videoFile, newPhotoFile: null,
      keepExistingVideo: false, keepExistingPhoto: false,
      currentMediaUrl: 'https://example.com/storage/v1/object/public/review-media/fl-1/old.mp4',
      currentPhotoUrl: null,
    });
    expect(err).toBeNull();
    expect(storage.remove).toHaveBeenCalledWith(['fl-1/old.mp4']);
  });
});

// ─── deleteReview ──────────────────────────────────────────────────────────────

describe('deleteReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageFrom.mockReturnValue(makeStorage());
  });

  it('deletes the review row from DB', async () => {
    const builder = makeBuilder({ data: [{ id: 'review-1' }], error: null });
    mockFrom.mockReturnValue(builder);

    const err = await deleteReview('review-1');
    expect(err).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith('reviews');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'review-1');
  });

  it('deletes media files from storage when URLs are provided', async () => {
    const storage = makeStorage();
    mockStorageFrom.mockReturnValue(storage);
    const builder = makeBuilder({ data: [{ id: 'review-1' }], error: null });
    mockFrom.mockReturnValue(builder);

    const err = await deleteReview(
      'review-1',
      'https://example.com/storage/v1/object/public/review-media/fl-1/review-1.mp4',
      'https://example.com/storage/v1/object/public/review-media/fl-1/review-1-photo.jpg',
    );
    expect(err).toBeNull();
    expect(storage.remove).toHaveBeenCalledWith(['fl-1/review-1.mp4', 'fl-1/review-1-photo.jpg']);
  });

  it('skips storage deletion when no URLs provided', async () => {
    const storage = makeStorage();
    mockStorageFrom.mockReturnValue(storage);
    const builder = makeBuilder({ data: [{ id: 'review-1' }], error: null });
    mockFrom.mockReturnValue(builder);

    const err = await deleteReview('review-1');
    expect(err).toBeNull();
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it('returns error message on DB failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'RLS violation' } });
    mockFrom.mockReturnValue(builder);

    const err = await deleteReview('review-1');
    expect(err).not.toBeNull();
  });

  it('returns error when RLS silently blocks delete (0 rows affected)', async () => {
    // Supabase returns error:null but data:[] when RLS blocks a DELETE
    const builder = makeBuilder({ data: [], error: null });
    mockFrom.mockReturnValue(builder);

    const err = await deleteReview('review-1');
    expect(err).not.toBeNull();
  });
});
