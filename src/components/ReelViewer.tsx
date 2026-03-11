import { X, Star, Heart, MessageCircle, Share2, Volume2 } from 'lucide-react';
import { Review } from '@/data/mockData';
import { useEffect, useRef, useState } from 'react';

interface ReelViewerProps {
  reviews: Review[];
  startIndex: number;
  onClose: () => void;
}

const ReelViewer = ({ reviews, startIndex, onClose }: ReelViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
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

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/95">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-50 rounded-full bg-background/20 p-2 text-background backdrop-blur-sm transition-colors hover:bg-background/30"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Reels Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y-mandatory scrollbar-hide"
      >
        {reviews.map((review, idx) => (
          <div
            key={review.id}
            className="relative flex h-full w-full snap-start items-center justify-center"
          >
            {/* Video Background Placeholder */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, hsl(${22 + idx * 15}, 80%, ${35 + idx * 5}%), hsl(${340 - idx * 10}, 70%, ${50 + idx * 3}%))`,
              }}
            >
              <div className="text-center px-8">
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-background/20 backdrop-blur-sm">
                  <Volume2 className="h-10 w-10 text-background" />
                </div>
                <p className="text-lg font-heading text-background/90">Video Review</p>
              </div>
            </div>

            {/* Right side actions */}
            <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-10">
              <button
                onClick={() => toggleLike(review.id)}
                className="flex flex-col items-center gap-1"
              >
                <Heart
                  className={`h-7 w-7 transition-colors ${
                    liked.has(review.id) ? 'fill-accent text-accent' : 'text-background'
                  }`}
                />
                <span className="text-xs text-background">
                  {liked.has(review.id) ? '124' : '123'}
                </span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <MessageCircle className="h-7 w-7 text-background" />
                <span className="text-xs text-background">18</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <Share2 className="h-7 w-7 text-background" />
                <span className="text-xs text-background">Share</span>
              </button>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-8 left-4 right-16 z-10">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={review.clientAvatar}
                  alt={review.clientName}
                  className="h-10 w-10 rounded-full bg-background/20"
                />
                <div>
                  <p className="font-semibold text-background text-sm">{review.clientName}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: review.rating }, (_, i) => (
                      <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-background/90 text-sm">{review.text}</p>
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
        ))}
      </div>
    </div>
  );
};

export default ReelViewer;
