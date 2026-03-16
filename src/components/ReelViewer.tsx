import { X, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface ReviewItem {
  id: string;
  clientId?: string;
  clientName: string;
  clientAvatar: string;
  rating: number;
  text: string;
  caption?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  photoUrl?: string | null;
  hasVideo?: boolean;
  createdAt?: string;
}

interface ReelViewerProps {
  reviews: ReviewItem[];
  startIndex: number;
  onClose: () => void;
}

const ReelViewer = ({ reviews, startIndex, onClose }: ReelViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const children = container.children;
    if (children[startIndex]) {
      (children[startIndex] as HTMLElement).scrollIntoView({ behavior: 'instant' });
    }
  }, [startIndex]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop;
    const height = container.clientHeight;
    const newIndex = Math.round(scrollTop / height);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reviews.length) {
      setCurrentIndex(newIndex);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/95">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-50 rounded-full bg-background/20 p-2 text-background backdrop-blur-sm transition-colors hover:bg-background/30"
      >
        <X className="h-6 w-6" />
      </button>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y-mandatory scrollbar-hide"
      >
        {reviews.map((review) => {
          const hasMedia = !!(review.mediaUrl || review.photoUrl);
          const textClr = hasMedia ? 'text-background' : 'text-foreground';
          const textClrMuted = hasMedia ? 'text-background/90' : 'text-muted-foreground';
          return (
            <div
              key={review.id}
              className={`relative flex h-full w-full snap-start items-center justify-center ${!hasMedia ? 'bg-card' : ''}`}
            >
              {/* Media Background */}
              {review.mediaUrl && review.mediaType === 'video' ? (
                <video
                  src={review.mediaUrl}
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay loop playsInline
                />
              ) : review.mediaUrl && review.mediaType === 'image' ? (
                <img
                  src={review.mediaUrl}
                  alt="Review"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : review.photoUrl ? (
                <img
                  src={review.photoUrl}
                  alt="Review photo"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : review.text || review.caption ? (
                <div className="absolute inset-0 flex items-center justify-center p-4 bg-muted">
                  <p className="text-sm text-center text-foreground line-clamp-4">{review.caption || review.text}</p>
                </div>
              ) : (
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #C85A2A 0%, #E8446D 100%)' }} />
              )}

              {/* Bottom info */}
              <div className="absolute bottom-8 left-4 right-4 z-10">
                <div className="flex items-center gap-3 mb-3">
                  {review.clientAvatar ? (
                    <img
                      src={review.clientAvatar}
                      alt={review.clientName}
                      className="h-10 w-10 rounded-full bg-background/20 object-cover"
                    />
                  ) : (
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${hasMedia ? 'bg-background/20 text-background' : 'bg-secondary text-foreground'}`}>
                      {review.clientName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className={`font-semibold text-sm ${textClr}`}>{review.clientName}</p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: review.rating }, (_, i) => (
                        <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                </div>
                {review.caption && (
                  <p className={`text-sm font-semibold ${textClr}`}>{review.caption}</p>
                )}
                {review.text && (
                  <p className={`text-sm ${textClrMuted}`}>{review.text}</p>
                )}
              </div>

              {/* Progress dots */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
                {reviews.map((_, dotIdx) => (
                  <div
                    key={dotIdx}
                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                      dotIdx === currentIndex ? 'bg-background h-4' : 'bg-background/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReelViewer;
