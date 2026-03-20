import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { generateVideoThumbnail } from '@/lib/videoUtils';
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
  newPhotoFiles: File[];
  keepExistingVideo: boolean;
  keepExistingPhotos: boolean;
  currentMediaUrl: string | null;
  currentPhotoUrls: string[];
  onProgress?: (msg: string) => void;
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
  for (const f of params.newPhotoFiles) {
    const p = validateReviewPhoto(f);
    if (!p.valid) return p.error!;
  }

  let finalMediaUrl: string | null = null;
  let hasVideo = false;
  let newThumbnailUrl: string | null | undefined = undefined; // undefined = don't overwrite existing

  if (params.newVideoFile) {
    const ext = params.newVideoFile.name.split('.').pop() ?? 'webm';
    const path = `${freelancerId}/${reviewId}.${ext}`;
    const sizeMB = (params.newVideoFile.size / 1024 / 1024).toFixed(1);
    console.log('[updateReview] uploading video to', path, `(${sizeMB}MB)`);
    params.onProgress?.(`Uploading video (${sizeMB}MB)...`);
    let uploadErr: { message: string } | null = null;
    try {
      const { error } = await supabase.storage
        .from('review-media')
        .upload(path, params.newVideoFile, { contentType: params.newVideoFile.type, upsert: true });
      uploadErr = error;
    } catch (e: unknown) {
      console.error('[updateReview] video upload threw:', e);
      return e instanceof Error ? e.message : 'Upload failed. Please try again.';
    }
    if (uploadErr) return 'Upload failed. Please try again.';
    finalMediaUrl = supabase.storage.from('review-media').getPublicUrl(path).data.publicUrl;
    hasVideo = true;
    try {
      const thumbTimeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('thumbnail timeout')), 8000));
      const thumbBlob = await Promise.race([generateVideoThumbnail(params.newVideoFile), thumbTimeout]);
      const thumbPath = `${freelancerId}/${reviewId}/thumbnail.jpg`;
      await supabase.storage.from('review-media').upload(thumbPath, thumbBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      });
      newThumbnailUrl = supabase.storage.from('review-media').getPublicUrl(thumbPath).data.publicUrl;
    } catch (e) {
      console.warn('[updateReview] thumbnail generation failed (non-fatal):', e);
      newThumbnailUrl = null;
    }
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
  if (params.newPhotoFiles.length > 0) {
    // Delete all existing photos from storage
    for (const url of params.currentPhotoUrls) {
      const old = getStoragePath(url);
      if (old) await supabase.storage.from('review-media').remove([old]);
    }
    // Delete existing review_photos rows
    await supabase.from('review_photos').delete().eq('review_id', reviewId);

    // Upload each new photo with a unique indexed path (Bug 3: avoid path conflicts)
    const uploadedUrls: string[] = [];
    params.onProgress?.('Uploading photos...');
    for (let idx = 0; idx < params.newPhotoFiles.length; idx++) {
      const f = params.newPhotoFiles[idx];
      const ext = f.name.split('.').pop() ?? 'jpg';
      const path = `${freelancerId}/${reviewId}-photo-${idx}.${ext}`;
      let photoErr: { message: string } | null = null;
      try {
        const { error } = await supabase.storage
          .from('review-media')
          .upload(path, f, { contentType: f.type, upsert: true });
        photoErr = error;
        if (photoErr) {
          console.error('[updateReview] photo upload error:', photoErr.message, photoErr);
          return 'Photo upload failed. Please try again.';
        }
      } catch (e: unknown) {
        console.error('[updateReview] photo upload threw:', e);
        return e instanceof Error ? e.message : 'Photo upload failed. Please try again.';
      }
      uploadedUrls.push(supabase.storage.from('review-media').getPublicUrl(path).data.publicUrl);
    }
    finalPhotoUrl = uploadedUrls[0] ?? null;

    // Insert into review_photos
    if (uploadedUrls.length > 0) {
      const rows = uploadedUrls.map((url, idx) => ({ review_id: reviewId, image_url: url, display_order: idx }));
      const { error: photoInsertErr } = await supabase.from('review_photos').insert(rows);
      if (photoInsertErr) console.error('[updateReview] review_photos insert error:', photoInsertErr.message);
    }
  } else if (params.keepExistingPhotos) {
    finalPhotoUrl = params.currentPhotoUrls[0] ?? null;
  } else {
    // Remove all existing photos
    for (const url of params.currentPhotoUrls) {
      const old = getStoragePath(url);
      if (old) await supabase.storage.from('review-media').remove([old]);
    }
    await supabase.from('review_photos').delete().eq('review_id', reviewId);
  }

  params.onProgress?.('Saving your Glaze...');
  const updatePayload: Record<string, unknown> = {
    rating: params.rating,
    caption: params.caption.trim() || null,
    text_content: params.textContent.trim() || null,
    media_url: finalMediaUrl,
    media_type: finalMediaUrl ? 'video' : null,
    photo_url: finalPhotoUrl,
    has_video: hasVideo,
  };
  if (newThumbnailUrl !== undefined) updatePayload.thumbnail_url = newThumbnailUrl;
  const { error } = await supabase
    .from('reviews')
    .update(updatePayload)
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
  thumbnailUrl?: string | null,
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
  if (thumbnailUrl) { const p = getStoragePath(thumbnailUrl); if (p) pathsToDelete.push(p); }
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
  thumbnail_url: string | null;
  created_at: string;
}

interface SubmitParams {
  clientId: string;
  rating: number;
  caption?: string;
  textContent?: string;
  videoFile?: File | null;
  photoFiles?: File[];
  onProgress?: (msg: string) => void;
}

const SELECT_FIELDS =
  'id, freelancer_id, client_id, rating, caption, text_content, media_url, media_type, photo_url, has_video, thumbnail_url, created_at';

export async function getMyReview(
  freelancerId: string,
  clientId: string,
): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select(SELECT_FIELDS)
    .eq('freelancer_id', freelancerId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) {
    console.error('[getMyReview] error:', error.message);
    return null;
  }
  return data as Review | null;
}

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
    photoFiles = [],
    onProgress,
  }: SubmitParams): Promise<string | null> {
    if (!freelancerId) return 'Not authenticated';

    const ratingCheck = validateReviewRating(rating);
    if (!ratingCheck.valid) return ratingCheck.error!;

    if (!videoFile) return 'A video Glaze is required.';

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

    for (const f of photoFiles) {
      const p = validateReviewPhoto(f);
      if (!p.valid) return p.error!;
    }

    // Check for duplicate before uploading
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('freelancer_id', freelancerId)
      .eq('client_id', clientId)
      .maybeSingle();
    if (existing) {
      return "You've already Glazed this freelancer. You can edit your existing Glaze.";
    }

    const reviewId = crypto.randomUUID();
    let mediaUrl: string | null = null;

    if (videoFile) {
      const ext = videoFile.name.split('.').pop() ?? 'webm';
      const path = `${freelancerId}/${reviewId}.${ext}`;
      const sizeMB = (videoFile.size / 1024 / 1024).toFixed(1);
      console.log('[useReviews] uploading video to', path, `(${sizeMB}MB)`);
      console.log('UPLOADING:', { fileSize: videoFile.size, fileType: videoFile.type, path });
      onProgress?.(`Uploading video (${sizeMB}MB)...`);
      let uploadData: unknown = null;
      try {
        const { error: uploadError, data } = await supabase.storage
          .from('review-media')
          .upload(path, videoFile, { contentType: videoFile.type, upsert: false });
        uploadData = data;
        console.log('UPLOAD RESULT:', { error: uploadError, data });
        if (uploadError) {
          console.error('[useReviews] video upload error:', uploadError.message);
          return 'Upload failed. Please try again.';
        }
      } catch (e: unknown) {
        console.error('[useReviews] video upload threw:', e);
        return e instanceof Error ? e.message : 'Upload failed. Please try again.';
      }
      void uploadData;
      const { data: { publicUrl } } = supabase.storage.from('review-media').getPublicUrl(path);
      mediaUrl = publicUrl;
    }

    // Generate and upload thumbnail for the video
    let thumbnailUrl: string | null = null;
    if (videoFile) {
      try {
        const thumbTimeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('thumbnail timeout')), 8000));
        const thumbBlob = await Promise.race([generateVideoThumbnail(videoFile), thumbTimeout]);
        const thumbPath = `${freelancerId}/${reviewId}/thumbnail.jpg`;
        await supabase.storage.from('review-media').upload(thumbPath, thumbBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });
        thumbnailUrl = supabase.storage.from('review-media').getPublicUrl(thumbPath).data.publicUrl;
      } catch (e) {
        console.warn('[submitReview] thumbnail generation failed (non-fatal):', e);
      }
    }

    // Upload all photos with unique indexed paths (Bug 3: avoid path conflicts)
    const uploadedPhotoUrls: string[] = [];
    console.log('[submitReview] 1. Photo files to upload:', photoFiles.length);
    if (photoFiles.length > 0) {
      onProgress?.('Uploading photos...');
      for (let idx = 0; idx < photoFiles.length; idx++) {
        const f = photoFiles[idx];
        const ext = f.name.split('.').pop() ?? 'jpg';
        const path = `${freelancerId}/${reviewId}-photo-${idx}.${ext}`;
        let uploadError: { message: string } | null = null;
        try {
          const { error } = await supabase.storage
            .from('review-media')
            .upload(path, f, { contentType: f.type, upsert: false });
          uploadError = error;
          console.log('[submitReview] 2. Upload result:', { path, error: uploadError?.message ?? null });
          if (uploadError) {
            console.error('[useReviews] photo upload error:', uploadError.message, uploadError);
            return 'Photo upload failed. Please try again.';
          }
        } catch (e: unknown) {
          console.error('[useReviews] photo upload threw:', e);
          return e instanceof Error ? e.message : 'Photo upload failed. Please try again.';
        }
        const { data: { publicUrl } } = supabase.storage.from('review-media').getPublicUrl(path);
        console.log('[submitReview] 3. Public URL:', publicUrl);
        uploadedPhotoUrls.push(publicUrl);
      }
    }

    onProgress?.('Saving your Glaze...');

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
        photo_url: uploadedPhotoUrls[0] ?? null,
        has_video: !!videoFile,
        thumbnail_url: thumbnailUrl,
      })
      .select(SELECT_FIELDS)
      .single();

    if (insertError) {
      console.error('[useReviews] insert error:', insertError.message);
      if ((insertError as { code?: string }).code === '23505') {
        return "You've already Glazed this freelancer. You can edit your existing Glaze.";
      }
      return 'Failed to submit review. Please try again.';
    }

    // Insert review_photos rows for all uploaded photos
    if (uploadedPhotoUrls.length > 0) {
      const rows = uploadedPhotoUrls.map((url, idx) => ({
        review_id: reviewId,
        image_url: url,
        display_order: idx,
      }));
      console.log('[submitReview] 4. Inserting review_photos rows:', rows.length);
      const { data: photoData, error: photoInsertErr } = await supabase.from('review_photos').insert(rows).select();
      console.log('[submitReview] 4. Insert result:', { data: photoData, error: photoInsertErr?.message ?? null });
      if (photoInsertErr) console.error('[submitReview] review_photos insert error:', photoInsertErr.message);
    }

    setReviews(prev => [data, ...prev]);
    return null;
  }

  return { reviews, loading, error, submitReview };
}
