import { useState, useRef, useEffect } from 'react';
import { Star, Image, Loader2, Upload, X, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useReviews, updateReview } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  validateReviewCaption,
  validateReviewText,
  validateReviewVideo,
  validateReviewPhoto,
} from '@/lib/validation';
import { ReviewCamera } from './ReviewCamera';
import type { ReviewItem } from '@/components/ReelViewer';

interface ReviewUploadProps {
  freelancerId: string;
  freelancerName?: string;
  onReviewSubmitted?: () => void;
  // Edit mode: controlled open + existing data
  existingReview?: ReviewItem;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export function ReviewUpload({
  freelancerId,
  freelancerName,
  onReviewSubmitted,
  existingReview,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ReviewUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { submitReview } = useReviews(freelancerId);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!existingReview;
  const isControlled = controlledOpen !== undefined;

  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = isControlled ? controlledOpen : internalOpen;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [caption, setCaption] = useState('');
  const [text, setText] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  // Edit mode: track whether to keep existing media
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill form when edit dialog opens
  useEffect(() => {
    if (isEditMode && dialogOpen && existingReview) {
      setRating(existingReview.rating);
      setCaption(existingReview.caption ?? '');
      setText(existingReview.text ?? '');
      setExistingVideoUrl(existingReview.mediaUrl ?? null);
      setExistingPhotoUrl(existingReview.photoUrl ?? null);
      setVideoFile(null);
      setVideoPreviewUrl(null);
      setPhotoFile(null);
      setPhotoPreviewUrl(null);
      setCaptionError(null);
      setTextError(null);
    }
  }, [isEditMode, dialogOpen, existingReview?.id]);

  if (!user) return null;

  const resetForm = () => {
    setRating(0); setCaption(''); setText('');
    setVideoFile(null); setVideoPreviewUrl(null);
    setPhotoFile(null); setPhotoPreviewUrl(null);
    setExistingVideoUrl(null); setExistingPhotoUrl(null);
    setCaptionError(null); setTextError(null);
  };

  const handleOpenChange = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    controlledOnOpenChange?.(v);
    if (!v) resetForm();
  };

  const setVideo = (f: File, url: string) => { setVideoFile(f); setVideoPreviewUrl(url); };
  const clearVideo = () => {
    setVideoFile(null); setVideoPreviewUrl(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = validateReviewVideo(f);
    if (!r.valid) { toast({ title: 'Error', description: r.error, variant: 'destructive' }); return; }
    setVideo(f, URL.createObjectURL(f));
  };

  const handleCameraCapture = (blob: Blob, url: string) =>
    setVideo(new File([blob], 'recording.webm', { type: 'video/webm' }), url);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = validateReviewPhoto(f);
    if (!r.valid) { toast({ title: 'Error', description: r.error, variant: 'destructive' }); return; }
    setPhotoFile(f); setPhotoPreviewUrl(URL.createObjectURL(f));
  };

  const clearPhoto = () => {
    setPhotoFile(null); setPhotoPreviewUrl(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const canSubmit = rating >= 1 && !captionError && !textError && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    let err: string | null;
    if (isEditMode && existingReview) {
      err = await updateReview(existingReview.id, freelancerId, {
        rating,
        caption,
        textContent: text,
        newVideoFile: videoFile,
        newPhotoFile: photoFile,
        keepExistingVideo: existingVideoUrl !== null,
        keepExistingPhoto: existingPhotoUrl !== null,
        currentMediaUrl: existingReview.mediaUrl ?? null,
        currentPhotoUrl: existingReview.photoUrl ?? null,
      });
    } else {
      err = await submitReview({ clientId: user.id, rating, caption, textContent: text, videoFile, photoFile });
    }

    setSubmitting(false);
    if (err) { toast({ title: 'Error', description: err, variant: 'destructive' }); return; }
    toast({ title: isEditMode ? 'Review updated!' : 'Review submitted!', description: 'Thank you for your review.' });
    resetForm();
    handleOpenChange(false);
    onReviewSubmitted?.();
  };

  // Current video display: new upload takes precedence over existing
  const showVideoPreview = videoPreviewUrl ?? (isEditMode ? existingVideoUrl : null);
  const showPhotoPreview = photoPreviewUrl ?? (isEditMode ? existingPhotoUrl : null);

  const dialogContent = (
    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEditMode ? 'Edit Review' : (freelancerName ? `Review ${freelancerName}` : 'Leave a Review')}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-5 pb-2">
        {/* Video section */}
        <div className="rounded-xl border-2 border-dashed border-border p-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Video className="h-4 w-4" />
            <span className="text-sm font-medium">Add a Video Review</span>
            <span className="text-xs ml-auto opacity-60">optional</span>
          </div>
          {showVideoPreview ? (
            <div className="relative">
              <video src={showVideoPreview} controls className="w-full rounded-lg max-h-52" />
              <button
                onClick={() => { clearVideo(); setExistingVideoUrl(null); }}
                className="absolute top-2 right-2 bg-background/80 border border-border rounded-full p-1 hover:bg-background transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <p className="text-xs text-muted-foreground mt-1">
                <button onClick={() => { clearVideo(); setExistingVideoUrl(null); }} className="underline hover:text-foreground">Re-record / Change</button>
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <ReviewCamera onCapture={handleCameraCapture} />
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => videoInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1.5" /> Upload
              </Button>
              <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
            </div>
          )}
        </div>

        {/* Rating */}
        <div>
          <p className="text-sm font-medium mb-2">Rating <span className="text-destructive">*</span></p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110">
                <Star className={`h-7 w-7 transition-colors ${n <= (hoverRating || rating) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </button>
            ))}
          </div>
          {rating === 0 && <p className="text-xs text-muted-foreground mt-1">Required to submit</p>}
        </div>

        {/* Caption */}
        <div>
          <Input placeholder="Sum it up in a few words" value={caption}
            onChange={e => { setCaption(e.target.value); const r = validateReviewCaption(e.target.value); setCaptionError(r.valid ? null : (r.error ?? null)); }}
            className="text-sm" />
          <div className="flex justify-between mt-1">
            {captionError ? <p className="text-xs text-destructive">{captionError}</p> : <span />}
            <p className="text-xs text-muted-foreground">{caption.length}/150</p>
          </div>
        </div>

        {/* Text */}
        <div>
          <Textarea placeholder="Share more details about your experience" value={text}
            onChange={e => { setText(e.target.value); const r = validateReviewText(e.target.value); setTextError(r.valid ? null : (r.error ?? null)); }}
            className="resize-none text-sm" rows={3} />
          <div className="flex justify-between mt-1">
            {textError ? <p className="text-xs text-destructive">{textError}</p> : <span />}
            <p className="text-xs text-muted-foreground">{text.length}/500</p>
          </div>
        </div>

        {/* Photo */}
        <div>
          {showPhotoPreview ? (
            <div className="relative w-20 h-20">
              <img src={showPhotoPreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
              <button onClick={() => { clearPhoto(); setExistingPhotoUrl(null); }}
                className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-0.5 hover:bg-secondary">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-1.5 cursor-pointer w-fit text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Image className="h-3.5 w-3.5" />
              <span>Add a photo (optional)</span>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          )}
        </div>

        {submitting && (
          <div className="w-full bg-secondary rounded-full h-1 overflow-hidden">
            <div className="bg-primary h-1 rounded-full w-2/3 animate-pulse" />
          </div>
        )}

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
          {submitting
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {isEditMode ? 'Updating...' : 'Uploading...'}</>
            : isEditMode ? 'Update Review' : 'Submit Review'}
        </Button>
      </div>
    </DialogContent>
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Leave a Review</Button>
        </DialogTrigger>
      )}
      {dialogContent}
    </Dialog>
  );
}
