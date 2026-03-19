import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, Grid3X3, Users, Play, Pencil, MoreVertical, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { IconInstagram, IconTikTok, IconYouTube, IconX, IconLinkedIn, IconGlobe } from '@/components/profile/SocialIcons';
import type { SocialLinks } from '@/components/profile/SocialLinksForm';
import donutLogo from '@/assets/Donut.svg';
import ReelViewer, { ReviewItem } from '@/components/ReelViewer';
import { useServices } from '@/hooks/useServices';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/hooks/useAuth';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { supabase } from '@/lib/supabase';
import { UserMenu } from '@/components/UserMenu';
import { ReviewUpload } from '@/components/ReviewUpload';
import { ReviewDetailModal } from '@/components/ReviewDetailModal';
import { deleteReview, getMyReview } from '@/hooks/useReviews';
import type { Review } from '@/hooks/useReviews';
import { GlazeFlow } from '@/components/GlazeFlow';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

type TabType = 'glazes' | 'portfolio' | 'client';

function DonutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  );
}

interface DbProfile {
  full_name: string;
  avatar_url: string | null;
  tagline: string | null;
  category: string | null;
  location: string | null;
  is_shy: boolean;
  review_prompt: string | null;
  social_links: SocialLinks | null;
  verified_instagram: boolean;
  verified_linkedin: boolean;
  verified_identity: boolean;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'xs' }) {
  const cls = size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: rating }, (_, i) => (
        <Star key={i} className={`${cls} fill-primary text-primary`} />
      ))}
    </div>
  );
}

interface ReviewMenuProps {
  review: ReviewItem;
  userId?: string;
  onEdit: (r: ReviewItem) => void;
  onDelete: (r: ReviewItem) => void;
}

function ReviewMenu({ review, userId, onEdit, onDelete }: ReviewMenuProps) {
  if (!userId || userId !== review.clientId) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <MoreVertical className="h-3.5 w-3.5 text-white" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => onEdit(review)}>Edit</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(review)}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const FreelancerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('glazes');
  const [refreshKey, setRefreshKey] = useState(0);
  const [reelOpen, setReelOpen] = useState(false);
  const [reelStartIndex, setReelStartIndex] = useState(0);
  const [detailReview, setDetailReview] = useState<ReviewItem | null>(null);
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [deletingReview, setDeletingReview] = useState<ReviewItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);

  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [dbReviews, setDbReviews] = useState<ReviewItem[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const { services: dbServices, loading: servicesLoading } = useServices(id);
  const { portfolio: dbPortfolio, loading: portfolioLoading } = usePortfolio(id);
  const isOwner = user?.id === id;
  const canReview = authProfile?.role === 'client' && !isOwner;

  useEffect(() => {
    if (!id) return;
    setProfileLoading(true);
    const fetchAll = async () => {
      try {
        const clientId = user?.id;
        const isClientUser = authProfile?.role === 'client' && clientId && clientId !== id;
        const [profileRes, reviewsRes, myReviewData] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name, avatar_url, tagline, category, location, is_shy, review_prompt, social_links, verified_instagram, verified_linkedin, verified_identity')
            .eq('id', id)
            .single(),
          supabase
            .from('reviews')
            .select('id, client_id, rating, caption, text_content, media_url, media_type, photo_url, created_at, profiles!reviews_client_id_fkey(full_name, avatar_url)')
            .eq('freelancer_id', id)
            .order('has_video', { ascending: false })
            .order('created_at', { ascending: false }),
          isClientUser ? getMyReview(id, clientId) : Promise.resolve(null),
        ]);
        setMyReview(myReviewData ?? null);
        if (profileRes.data) {
          setProfile({
            ...profileRes.data,
            is_shy: profileRes.data.is_shy ?? false,
            review_prompt: profileRes.data.review_prompt ?? null,
            social_links: (profileRes.data.social_links as SocialLinks) ?? null,
            verified_instagram: profileRes.data.verified_instagram ?? false,
            verified_linkedin: profileRes.data.verified_linkedin ?? false,
            verified_identity: profileRes.data.verified_identity ?? false,
          });
        }
        const reviews: ReviewItem[] = (reviewsRes.data ?? []).map((r: any) => ({
          id: r.id,
          clientId: r.client_id,
          clientName: r.profiles?.full_name ?? 'Anonymous',
          clientAvatar: r.profiles?.avatar_url ?? '',
          rating: r.rating,
          text: r.text_content ?? '',
          caption: r.caption ?? null,
          mediaUrl: r.media_url,
          mediaType: r.media_type,
          photoUrl: r.photo_url ?? null,
          createdAt: r.created_at,
        }));
        setDbReviews(reviews);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchAll();
  }, [id, refreshKey]);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Freelancer not found</p>
          <Link to="/" className="text-primary hover:underline text-sm">Back to browse</Link>
        </div>
      </div>
    );
  }

  const username = profile.full_name.toLowerCase().replace(/\s+/g, '');
  const avatar = profile.is_shy
    ? donutLogo
    : (profile.avatar_url ?? `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(profile.full_name)}`);

  const avgRating = dbReviews.length > 0
    ? Math.round((dbReviews.reduce((sum, r) => sum + r.rating, 0) / dbReviews.length) * 10) / 10
    : 0;

  const videoReviews = dbReviews.filter(r => r.mediaType === 'video' && r.mediaUrl);
  const photoReviews = dbReviews.filter(r => r.mediaType !== 'video' && (r.photoUrl || r.mediaUrl));
  const textReviews = dbReviews.filter(r => !r.mediaUrl && !r.photoUrl);

  const handleDeleteConfirm = async () => {
    if (!deletingReview) return;
    setDeleteLoading(true);
    const err = await deleteReview(deletingReview.id, deletingReview.mediaUrl, deletingReview.photoUrl);
    setDeleteLoading(false);
    if (err) {
      toast({ title: 'Error', description: err, variant: 'destructive' });
    } else {
      setDbReviews(prev => prev.filter(r => r.id !== deletingReview.id));
      toast({ title: 'Glaze deleted.' });
    }
    setDeletingReview(null);
  };

  const tabs: { key: TabType; icon: React.FC<{ className?: string }>; label: string }[] = [
    { key: 'glazes', icon: DonutIcon, label: 'Glazes' },
    { key: 'portfolio', icon: Grid3X3, label: 'Portfolio' },
    { key: 'client', icon: Users, label: 'Client Receipts' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/" className="hover:opacity-80 transition-opacity cursor-pointer">
            <img src={donutLogo} alt="Glaze" className="h-10 w-10" />
          </Link>
          <span className="font-heading text-lg font-bold text-foreground flex-1">@{username}</span>
          {isOwner && (
            <Link to="/edit-profile" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md border border-border">
              <Pencil className="h-3 w-3" /> Edit Profile
            </Link>
          )}
          {!user && (
            <Link to="/login" className="text-sm font-medium text-primary hover:underline px-2">Sign In</Link>
          )}
          <UserMenu />
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4">
        <div className="py-6 space-y-4">
          {/* Avatar + name + category */}
          <div className="flex items-start gap-5">
            <img
              src={avatar}
              alt={profile.full_name}
              className={`h-20 w-20 rounded-full bg-secondary shrink-0 object-cover ${profile.is_shy ? 'opacity-80' : ''}`}
            />
            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-xl font-bold text-foreground truncate">{profile.full_name}</h1>
              <p className="text-sm text-muted-foreground mb-2">@{username}</p>
              {profile.category && (
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {profile.category}
                </span>
              )}
              {(profile.verified_instagram || profile.verified_linkedin || profile.verified_identity) && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {profile.verified_instagram && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/30 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                      <IconInstagram className="h-3 w-3" /> Instagram ✓
                    </span>
                  )}
                  {profile.verified_linkedin && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/30 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                      <IconLinkedIn className="h-3 w-3" /> LinkedIn ✓
                    </span>
                  )}
                  {profile.verified_identity && (
                    <span className="flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-950/30 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                      <Shield className="h-3 w-3" /> Identity ✓
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Services as pills */}
          {!servicesLoading && dbServices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dbServices.map(s => (
                <span
                  key={s.id}
                  className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground"
                >
                  {s.service_name}
                </span>
              ))}
            </div>
          )}

          {/* Tagline */}
          {profile.tagline && <p className="text-sm text-foreground">{profile.tagline}</p>}

          {/* Social links */}
          {profile.social_links && Object.values(profile.social_links).some(Boolean) && (
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { key: 'instagram', icon: IconInstagram },
                { key: 'tiktok',    icon: IconTikTok },
                { key: 'youtube',   icon: IconYouTube },
                { key: 'twitter',   icon: IconX },
                { key: 'linkedin',  icon: IconLinkedIn },
                { key: 'website',   icon: IconGlobe },
              ].map(({ key, icon: Icon }) => {
                const href = profile.social_links?.[key as keyof SocialLinks];
                if (!href) return null;
                const url = href.startsWith('http') ? href : `https://${href}`;
                return (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors">
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-4 py-3 border-t border-b border-border">
            <div className="text-center">
              <p className="text-base font-bold text-foreground">{dbReviews.length}</p>
              <p className="text-xs text-muted-foreground">Glazes</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-foreground">{avgRating > 0 ? avgRating : '—'}</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
            {canReview && id && (
              <div className="ml-auto">
                <ReviewUpload
                  freelancerId={id}
                  freelancerName={profile.full_name}
                  freelancerAvatar={avatar}
                  reviewPrompt={profile.review_prompt}
                  myReview={myReview}
                  onReviewSubmitted={() => setRefreshKey(k => k + 1)}
                />
              </div>
            )}
          </div>

          {/* Review prompt collapsible */}
          {profile.review_prompt && (
            <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3">
              <button
                className="w-full flex items-center justify-between text-left gap-2"
                onClick={() => setPromptOpen(v => !v)}
              >
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  What clients should mention
                </span>
                {promptOpen
                  ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                }
              </button>
              {promptOpen && (
                <p className="mt-2 text-sm text-foreground">{profile.review_prompt}</p>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="py-4">
          {/* Glazes Tab */}
          {activeTab === 'glazes' && (
            <div>
              {videoReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No Glazes yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {videoReviews.map((review, idx) => (
                    <div key={review.id} className="relative aspect-[9/16] overflow-hidden rounded-md bg-secondary group">
                      <video src={review.mediaUrl!} className="absolute inset-0 h-full w-full object-cover" muted playsInline />
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => { setReelStartIndex(idx); setReelOpen(true); }}
                      >
                        <Play className="h-8 w-8 text-background fill-background" />
                      </div>
                      <div className="absolute top-2 right-2">
                        <ReviewMenu review={review} userId={user?.id} onEdit={setEditingReview} onDelete={setDeletingReview} />
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
                        <p className="text-[10px] text-background font-medium truncate">{review.clientName}</p>
                        <StarRow rating={review.rating} size="xs" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <div>
              {portfolioLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading portfolio...</p>
              ) : dbPortfolio.length > 0 ? (
                <Carousel opts={{ align: 'start', loop: true }} className="w-full">
                  <CarouselContent className="-ml-3">
                    {dbPortfolio.map(item => (
                      <CarouselItem key={item.id} className="pl-3 basis-4/5 sm:basis-1/2">
                        <div className="rounded-xl overflow-hidden border border-border bg-card">
                          <div className="aspect-[4/3] overflow-hidden bg-secondary">
                            <img
                              src={item.image_url}
                              alt={item.caption ?? ''}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="px-3 py-2.5">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {item.caption ?? 'Untitled'}
                            </p>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="flex items-center justify-end gap-2 mt-3">
                    <CarouselPrevious className="static translate-y-0" />
                    <CarouselNext className="static translate-y-0" />
                  </div>
                </Carousel>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No portfolio photos yet.</p>
              )}
            </div>
          )}

          {/* Client Receipts Tab */}
          {activeTab === 'client' && (
            <div className="space-y-4">
              {photoReviews.length === 0 && textReviews.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No client receipts yet.</p>
              )}

              {/* Photo reviews in list */}
              {photoReviews.map(review => {
                const initials = review.clientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={review.id} className="border border-border rounded-lg p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => setDetailReview(review)}>
                    <div className="flex items-start gap-3">
                      {review.clientAvatar ? (
                        <img src={review.clientAvatar} alt={review.clientName} className="h-8 w-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">{initials}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{review.clientName}</span>
                          <StarRow rating={review.rating} />
                          <span className="text-xs text-muted-foreground ml-auto">{formatDate(review.createdAt)}</span>
                          <div onClick={e => e.stopPropagation()}>
                            {user?.id === review.clientId && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-0.5 text-muted-foreground hover:text-foreground transition-colors">
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingReview(review)}>Edit</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => setDeletingReview(review)}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                        {review.caption && <p className="text-sm font-semibold text-foreground mt-1">{review.caption}</p>}
                        {review.text && <p className="text-sm text-muted-foreground mt-1">{review.text}</p>}
                        {(review.photoUrl ?? review.mediaUrl) && (
                          <img
                            src={review.photoUrl ?? review.mediaUrl ?? ''}
                            alt="Receipt photo"
                            className="mt-2 rounded-md max-h-48 object-cover"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Text-only reviews */}
              {textReviews.map(review => {
                const initials = review.clientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={review.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {review.clientAvatar ? (
                        <img src={review.clientAvatar} alt={review.clientName} className="h-8 w-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">{initials}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{review.clientName}</span>
                          <StarRow rating={review.rating} />
                          <span className="text-xs text-muted-foreground ml-auto">{formatDate(review.createdAt)}</span>
                          {user?.id === review.clientId && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-0.5 text-muted-foreground hover:text-foreground transition-colors">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingReview(review)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingReview(review)}>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        {review.caption && <p className="text-sm font-semibold text-foreground mt-1">{review.caption}</p>}
                        {review.text && <p className="text-sm text-muted-foreground mt-1">{review.text}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Video Reel Viewer */}
      {reelOpen && (
        <ReelViewer reviews={videoReviews} startIndex={reelStartIndex} onClose={() => setReelOpen(false)} />
      )}

      {/* Photo / text detail modal */}
      {detailReview && (
        <ReviewDetailModal review={detailReview} onClose={() => setDetailReview(null)} />
      )}

      {/* Edit Glaze flow (full-screen) */}
      {editingReview && id && (
        <GlazeFlow
          freelancerId={id}
          freelancerName={profile.full_name}
          existingReview={editingReview}
          onClose={() => setEditingReview(null)}
          onSubmitted={() => { setEditingReview(null); setRefreshKey(k => k + 1); }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingReview} onOpenChange={v => { if (!v) setDeletingReview(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Glaze?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone. The Glaze and any attached media will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FreelancerProfile;
