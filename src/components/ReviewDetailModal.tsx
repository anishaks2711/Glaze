import { X, Star } from 'lucide-react';
import { ReviewItem } from '@/components/ReelViewer';

interface ReviewDetailModalProps {
  review: ReviewItem;
  onClose: () => void;
}

export function ReviewDetailModal({ review, onClose }: ReviewDetailModalProps) {
  const isPhoto = !!(review.photoUrl || (review.mediaUrl && review.mediaType === 'image'));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-xl overflow-hidden bg-card shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {isPhoto ? (
          <>
            <div className="w-full bg-black">
              <img
                src={review.photoUrl ?? review.mediaUrl ?? ''}
                alt="Review"
                className="w-full max-h-72 object-contain"
              />
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-foreground">{review.clientName}</p>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: review.rating }, (_, i) => (
                    <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                  ))}
                </div>
              </div>
              {review.caption && <p className="text-sm font-medium text-foreground">{review.caption}</p>}
              {review.text && <p className="text-sm text-muted-foreground">{review.text}</p>}
            </div>
          </>
        ) : (
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-foreground">{review.clientName}</p>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: review.rating }, (_, i) => (
                  <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                ))}
              </div>
            </div>
            {review.caption && <p className="text-base font-medium text-foreground">{review.caption}</p>}
            {review.text && <p className="text-sm text-muted-foreground">{review.text}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
