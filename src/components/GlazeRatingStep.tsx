import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { validateReviewCaption, validateReviewText } from '@/lib/validation';

interface GlazeRatingStepProps {
  videoPreviewUrl: string | null;
  initialRating?: number;
  initialCaption?: string;
  initialText?: string;
  onReplaceVideo: () => void;
  onNext: (rating: number, caption: string, text: string) => void;
}

export function GlazeRatingStep({
  videoPreviewUrl,
  initialRating = 0,
  initialCaption = '',
  initialText = '',
  onReplaceVideo,
  onNext,
}: GlazeRatingStepProps) {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [caption, setCaption] = useState(initialCaption);
  const [text, setText] = useState(initialText);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);

  const canNext = rating >= 1 && !captionError && !textError;

  return (
    <div className="space-y-5">
      {videoPreviewUrl && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
          <video src={videoPreviewUrl} controls playsInline autoPlay muted className="w-full h-full object-cover" />
          <button
            onClick={onReplaceVideo}
            className="absolute bottom-2 right-2 text-xs text-white/80 underline bg-black/50 px-2 py-1 rounded"
          >
            Replace video
          </button>
        </div>
      )}

      <div>
        <p className="text-sm font-medium mb-2">
          Rating <span className="text-destructive">*</span>
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  n <= (hover || rating) ? 'fill-primary text-primary' : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
        {rating === 0 && (
          <p className="text-xs text-muted-foreground mt-1">Required to continue</p>
        )}
      </div>

      <div>
        <Input
          placeholder="Sum it up in a few words"
          value={caption}
          onChange={e => {
            setCaption(e.target.value);
            const r = validateReviewCaption(e.target.value);
            setCaptionError(r.valid ? null : (r.error ?? null));
          }}
        />
        <div className="flex justify-between mt-1">
          {captionError ? <p className="text-xs text-destructive">{captionError}</p> : <span />}
          <p className="text-xs text-muted-foreground">{caption.length}/150</p>
        </div>
      </div>

      <div>
        <Textarea
          placeholder="Share more details about your experience (optional)"
          value={text}
          onChange={e => {
            setText(e.target.value);
            const r = validateReviewText(e.target.value);
            setTextError(r.valid ? null : (r.error ?? null));
          }}
          className="resize-none"
          rows={3}
        />
        <div className="flex justify-between mt-1">
          {textError ? <p className="text-xs text-destructive">{textError}</p> : <span />}
          <p className="text-xs text-muted-foreground">{text.length}/500</p>
        </div>
      </div>

      <Button onClick={() => onNext(rating, caption, text)} disabled={!canNext} className="w-full">
        Next
      </Button>
    </div>
  );
}
