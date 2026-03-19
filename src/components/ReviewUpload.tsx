import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { GlazeFlow } from './GlazeFlow';
import { ChatSidebar } from './ChatSidebar';
import type { Review } from '@/hooks/useReviews';
import type { ReviewItem } from '@/components/ReelViewer';

interface ReviewUploadProps {
  freelancerId: string;
  freelancerName?: string;
  freelancerAvatar?: string;
  reviewPrompt?: string | null;
  onReviewSubmitted?: () => void;
  myReview?: Review | null;
  // Edit mode (controlled) — used directly when editing from video cards
  existingReview?: ReviewItem;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export function ReviewUpload({
  freelancerId,
  freelancerName,
  freelancerAvatar,
  reviewPrompt,
  onReviewSubmitted,
  myReview,
  existingReview,
  open: controlledOpen,
  onOpenChange,
}: ReviewUploadProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  if (!user) return null;

  const isControlled = controlledOpen !== undefined;
  const flowOpen = isControlled ? !!controlledOpen : internalOpen;

  const handleClose = () => {
    if (isControlled) onOpenChange?.(false);
    else setInternalOpen(false);
  };

  // Map Review (DB shape) to ReviewItem for GlazeFlow edit mode
  const myReviewItem: ReviewItem | undefined = myReview
    ? {
        id: myReview.id,
        clientId: myReview.client_id,
        clientName: '',
        clientAvatar: '',
        rating: myReview.rating,
        text: myReview.text_content ?? '',
        caption: myReview.caption,
        mediaUrl: myReview.media_url,
        mediaType: myReview.media_type,
        photoUrl: myReview.photo_url,
        createdAt: myReview.created_at,
      }
    : undefined;

  const activeExistingReview = existingReview ?? (isControlled && myReview ? myReviewItem : undefined);

  return (
    <>
      {!isControlled && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => setChatOpen(true)}
          >
            Message
          </Button>
          {myReview ? (
            <>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                You've Glazed {freelancerName}
              </span>
              <Button variant="outline" size="sm" onClick={() => setInternalOpen(true)}>
                Edit your Glaze
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setInternalOpen(true)}>
              Leave a Glaze
            </Button>
          )}
        </div>
      )}

      {flowOpen && (
        <GlazeFlow
          freelancerId={freelancerId}
          freelancerName={freelancerName ?? 'Freelancer'}
          reviewPrompt={reviewPrompt}
          existingReview={activeExistingReview}
          onClose={handleClose}
          onSubmitted={() => onReviewSubmitted?.()}
        />
      )}

      <ChatSidebar
        open={chatOpen}
        onOpenChange={setChatOpen}
        freelancerId={freelancerId}
        freelancerName={freelancerName ?? 'Freelancer'}
        freelancerAvatar={freelancerAvatar}
      />
    </>
  );
}
