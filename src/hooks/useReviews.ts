import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  validateReviewRating,
  validateReviewText,
  validateReviewCaption,
  validateReviewVideo,
  validateReviewPhoto,
} from '@/lib/validation';

function getStoragePath(url: string): string {
  const marker = '/review-media/';
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : '';
}

export interface UpdateReviewParams {
  rating: number;
  caption: string;
  textContent: string;
  newVideoFile: File | null;
  newPhotoFile: File | null;
  keepExistingVideo: boolean;
  keepExistingPhoto: boolean;
  currentMediaUrl: string | null;
  currentPhotoUrl: string | null;
}

export async function updateReview(
  reviewId: string,
  freelancerId: string,
  params: UpdateReviewParams,
): Promise<string | null> {
  const ratingCheck = validateReviewRating(params.rating);
  if (!ratingCheck.valid) return ratingCheck.error!;
  if (params.caption) {
    const c = validateReviewCaption(params.caption);
    if (!c.valid) return c.error!;
  }
  if (params.textContent) {
    const t = validateReviewText(params.textContent);
    if (!t.valid) return t.error!;
  }
  if (params.newVideoFile) {
    const v = validateReviewVideo(params.newVideoFile);
    if (!v.valid) return v.error!;
  }
  if (params.newPhotoFile) {
    const p = validateReviewPhoto(params.newPhotoFile);
    if (!p.valid) return p.error!;
  }

  let finalMediaUrl: string | null = null;
  let hasVideo = false;

  if (params.newVideoFile) {
    const ext = params.newVideoFile.name.split('.').pop() ?? 'webm';
    const path = `${freelancerId}/${reviewId}.${ext}`;
    const { error } = await supabase.storage
      .from('review-media')
      .upload(path, params.newVideoFile, { contentType: params.newVideoFile.type, upsert: true });
    if (error) return 'Upload failed. Please try again.';
    finalMediaUrl = supabase.storage.from('review-media').getPublicUrl(path).data.publicUrl;
    hasVideo = true;
    if (params.currentMediaUrl) {
      const old = getStoragePath(params.currentMediaUrl);
      if (old) await supabase.storage.from('review-media').remove([old]);
    }
  } else if (params.keepExistingVideo) {
    finalMediaUrl = params.currentMediaUrl;
    hasVideo = !!params.currentMediaUrl;
  } else if (params.currentMediaUrl) {
    const old = getStoragePath(params.currentMediaUrl);
    if (old) await supabase.storage.from('review-media').remove([old]);
  }

  let finalPhotoUrl: string | null = null;
  if (params.newPhotoFile) {
    const ext = params.newPhotoFile.name.split('.').pop() ?? 'jpg';
    const path = `${freelancerId}/${reviewId}-photo.${ext}`;
    const { error } = await supabase.storage
      .from('review-media')
      .upload(path, params.newPhotoFile, { contentType: params.newPhotoFile.type, upsert: true });
    if (error) return 'Photo upload failed. Please try again.';
    finalPhotoUrl = supabase.storage.from('review-media').getPublicUrl(path).data.publicUrl;
    if (params.currentPhotoUrl) {
      const old = getStoragePath(params.currentPhotoUrl);
      if (old) await supabase.storage.from('review-media').remove([old]);
    }
  } else if (params.keepExistingPhoto) {
    finalPhotoUrl = params.currentPhotoUrl;
  } else if (params.currentPhotoUrl) {
    const old = getStoragePath(params.currentPhotoUrl);
    if (old) await supabase.storage.from('review-media').remove([old]);
  }

  const { error } = await supabase
    .from('reviews')
    .update({
      rating: params.rating,
      caption: params.caption.trim() || null,
      text_content: params.textContent.trim() || null,
      media_url: finalMediaUrl,
      media_type: finalMediaUrl ? 'video' : null,
      photo_url: finalPhotoUrl,
      has_video: hasVideo,
    })
    .eq('id', reviewId);

  if (error) {
    console.error('[updateReview] error:', error.message);
    return 'Failed to update review. Please try again.';
  }
  return null;
}

export async function deleteReview(
  reviewId: string,
  mediaUrl?: string | null,
  photoUrl?: string | null,
): Promise<string | null> {
  const { data: deleted, error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .select('id');
  if (error) {
    console.error('[deleteReview] error:', error.message);
    return 'Failed to delete review. Please try again.';
  }
  if (!deleted || deleted.length === 0) {
    console.error('[deleteReview] 0 rows deleted — RLS policy may be blocking this operation');
    return 'Failed to delete review. Please try again.';
  }
  const pathsToDelete: string[] = [];
  if (mediaUrl) { const p = getStoragePath(mediaUrl); if (p) pathsToDelete.push(p); }
  if (photoUrl) { const p = getStoragePath(photoUrl); if (p) pathsToDelete.push(p); }
  if (pathsToDelete.length > 0) {
    await supabase.storage.from('review-media').remove(pathsToDelete);
  }
  return null;
}

export interface Review {
  id: string;
  freelancer_id: string;
  client_id: string;
  rating: number;
  caption: string | null;
  text_content: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  photo_url: string | null;
  has_video: boolean;
  created_at: string;
}

interface SubmitParams {
  clientId: string;
  rating: number;
  caption?: string;
  textContent?: string;
  videoFile?: File | null;
  photoFile?: File | null;
}

const SELECT_FIELDS =
  'id, freelancer_id, client_id, rating, caption, text_content, media_url, media_type, photo_url, has_video, created_at';

export function useReviews(freelancerId: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!freelancerId) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from('reviews')
      .select(SELECT_FIELDS)
      .eq('freelancer_id', freelancerId)
      .order('has_video', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setReviews(data ?? []);
        setLoading(false);
      });
  }, [freelancerId]);

  async function submitReview({
    clientId,
    rating,
    caption = '',
    textContent = '',
    videoFile,
    photoFile,
  }: SubmitParams): Promise<string | null> {
    if (!freelancerId) return 'Not authenticated';

    const ratingCheck = validateReviewRating(rating);
    if (!ratingCheck.valid) return ratingCheck.error!;

    if (caption) {
      const captionCheck = validateReviewCaption(caption);
      if (!captionCheck.valid) return captionCheck.error!;
    }

    if (textContent) {
      const textCheck = validateReviewText(textContent);
      if (!textCheck.valid) return textCheck.error!;
    }

    const videoCheck = validateReviewVideo(videoFile ?? null);
    if (!videoCheck.valid) return videoCheck.error!;

    const photoCheck = validateReviewPhoto(photoFile ?? null);
    if (!photoCheck.valid) return photoCheck.error!;

    const reviewId = crypto.randomUUID();
    let mediaUrl: string | null = null;
    let photoUrl: string | null = null;

    if (videoFile) {
      const ext = videoFile.name.split('.').pop() ?? 'webm';
      const path = `${freelancerId}/${reviewId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('review-media')
        .upload(path, videoFile, { contentType: videoFile.type, upsert: false });
      if (uploadError) {
        console.error('[useReviews] video upload error:', uploadError.message);
        return 'Upload failed. Please try again.';
      }
      const { data: { publicUrl } } = supabase.storage.from('review-media').getPublicUrl(path);
      mediaUrl = publicUrl;
    }

    if (photoFile) {
      const ext = photoFile.name.split('.').pop() ?? 'jpg';
      const path = `${freelancerId}/${reviewId}-photo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('review-media')
        .upload(path, photoFile, { contentType: photoFile.type, upsert: false });
      if (uploadError) {
        console.error('[useReviews] photo upload error:', uploadError.message);
        return 'Photo upload failed. Please try again.';
      }
      const { data: { publicUrl } } = supabase.storage.from('review-media').getPublicUrl(path);
      photoUrl = publicUrl;
    }

    const { data, error: insertError } = await supabase
      .from('reviews')
      .insert({
        id: reviewId,
        freelancer_id: freelancerId,
        client_id: clientId,
        rating,
        caption: caption.trim() || null,
        text_content: textContent.trim() || null,
        media_url: mediaUrl,
        media_type: mediaUrl ? 'video' : null,
        photo_url: photoUrl,
        has_video: !!videoFile,
      })
      .select(SELECT_FIELDS)
      .single();

    if (insertError) {
      console.error('[useReviews] insert error:', insertError.message);
      return 'Failed to submit review. Please try again.';
    }

    setReviews(prev => [data, ...prev]);
    return null;
  }

  return { reviews, loading, error, submitReview };
}
