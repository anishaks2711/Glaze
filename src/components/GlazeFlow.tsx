import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlazePromptStep } from './GlazePromptStep';
import { GlazeVideoStep } from './GlazeVideoStep';
import { GlazeRatingStep } from './GlazeRatingStep';
import { GlazePhotosStep } from './GlazePhotosStep';
import { useReviews, updateReview } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { ReviewItem } from '@/components/ReelViewer';

type Step = 'prompt' | 'video' | 'rating' | 'photos' | 'success';

interface GlazeFlowProps {
  freelancerId: string;
  freelancerName: string;
  reviewPrompt?: string | null;
  existingReview?: ReviewItem;
  onClose: () => void;
  onSubmitted: () => void;
}

export function GlazeFlow({
  freelancerId, freelancerName, reviewPrompt, existingReview, onClose, onSubmitted,
}: GlazeFlowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { submitReview } = useReviews(freelancerId);
  const isEditMode = !!existingReview;

  const [step, setStep] = useState<Step>(isEditMode ? 'rating' : 'prompt');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(
    isEditMode ? (existingReview?.mediaUrl ?? null) : null
  );
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [caption, setCaption] = useState(existingReview?.caption ?? '');
  const [text, setText] = useState(existingReview?.text ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLong, setUploadingLong] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  if (!user) return null;

  const handleVideoSelected = (file: File, url: string) => {
    setVideoFile(file);
    setVideoPreviewUrl(url);
    setStep('rating');
  };

  const handleRatingNext = (r: number, c: string, t: string) => {
    setRating(r);
    setCaption(c);
    setText(t);
    setStep('photos');
  };

  const handleSubmit = async (photos: File[]) => {
    if (!rating) return;
    setSubmitting(true);
    const longTimer = setTimeout(() => setUploadingLong(true), 60000);

    let err: string | null;
    try {
      if (isEditMode && existingReview) {
        err = await updateReview(existingReview.id, freelancerId, {
          rating,
          caption,
          textContent: text,
          newVideoFile: videoFile,
          newPhotoFile: photos[0] ?? null,
          keepExistingVideo: !videoFile && !!existingReview.mediaUrl,
          keepExistingPhoto: photos.length === 0 && !!existingReview.photoUrl,
          currentMediaUrl: existingReview.mediaUrl ?? null,
          currentPhotoUrl: existingReview.photoUrl ?? null,
          onProgress: setUploadStatus,
        });
      } else {
        if (!videoFile) {
          clearTimeout(longTimer);
          setSubmitting(false);
          toast({ title: 'Error', description: 'A video Glaze is required.', variant: 'destructive' });
          return;
        }
        err = await submitReview({
          clientId: user.id,
          rating,
          caption,
          textContent: text,
          videoFile,
          photoFile: photos[0] ?? null,
          onProgress: setUploadStatus,
        });
      }
    } catch (e: unknown) {
      console.error('[GlazeFlow] submit threw unexpectedly:', e);
      err = 'Something went wrong. Please try again.';
    }

    clearTimeout(longTimer);
    setSubmitting(false);
    setUploadingLong(false);
    setUploadStatus(null);

    if (err) {
      toast({ title: 'Error', description: err, variant: 'destructive' });
      return;
    }
    setStep('success');
    onSubmitted();
  };

  if (step === 'video') {
    return <GlazeVideoStep onVideoSelected={handleVideoSelected} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border px-4 py-3 flex items-center gap-3 bg-background">
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">
          {step === 'success' ? 'Glaze posted!' : isEditMode ? 'Edit your Glaze' : 'Leave a Glaze'}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-6">
          {step === 'prompt' && (
            <GlazePromptStep
              freelancerName={freelancerName}
              reviewPrompt={reviewPrompt}
              onStart={() => setStep('video')}
            />
          )}
          {step === 'rating' && (
            <GlazeRatingStep
              videoPreviewUrl={videoPreviewUrl}
              initialRating={rating}
              initialCaption={caption}
              initialText={text}
              onReplaceVideo={() => setStep('video')}
              onNext={handleRatingNext}
            />
          )}
          {step === 'photos' && (
            <GlazePhotosStep
              isEditMode={isEditMode}
              submitting={submitting}
              uploadingLong={uploadingLong}
              statusLabel={uploadStatus ?? undefined}
              onSubmit={handleSubmit}
            />
          )}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center min-h-[65vh] text-center gap-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Your Glaze has been posted!</h2>
                <p className="text-muted-foreground text-sm">Thank you for sharing your experience.</p>
              </div>
              <Button onClick={onClose} className="w-full max-w-xs">Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
