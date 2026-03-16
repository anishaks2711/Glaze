import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Grid3X3, Film, Users, Play, Briefcase, Pencil, MoreVertical } from 'lucide-react';
import { IconInstagram, IconTikTok, IconYouTube, IconX, IconLinkedIn, IconGlobe } from '@/components/profile/SocialIcons';
import type { SocialLinks } from '@/components/profile/SocialLinksForm';
import donutLogo from '@/assets/donut-logo.png';
import ReelViewer, { ReviewItem } from '@/components/ReelViewer';
import { useServices } from '@/hooks/useServices';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
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
import { deleteReview } from '@/hooks/useReviews';
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

type TabType = 'reviews' | 'portfolio' | 'client' | 'services';

interface DbProfile {
  full_name: string;
  avatar_url: string | null;
  tagline: string | null;
  category: string | null;
  location: string | null;
  social_links: SocialLinks | null;
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
  const [activeTab, setActiveTab] = useState<TabType>('reviews');
  const [refreshKey, setRefreshKey] = useState(0);
  const [reelOpen, setReelOpen] = useState(false);
  const [reelStartIndex, setReelStartIndex] = useState(0);
  const [detailReview, setDetailReview] = useState<ReviewItem | null>(null);
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [deletingReview, setDeletingReview] = useState<ReviewItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [dbReviews, setDbReviews] = useState<ReviewItem[]>([]);
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
        const [profileRes, reviewsRes] = await Promise.all([
          supabase.from('profiles').select('full_name, avatar_url, tagline, category, location').eq('id', id).single(),
          supabase
            .from('reviews')
            .select('id, client_id, rating, caption, text_content, media_url, media_type, photo_url, created_at, profiles!reviews_client_id_fkey(full_name, avatar_url)')
            .eq('freelancer_id', id)
            .order('has_video', { ascending: false })
            .order('created_at', { ascending: false }),
        ]);
        if (profileRes.data) {
          // Fetch social_links separately so a missing column doesn't break the profile page
          const socialRes = await supabase.from('profiles').select('social_links').eq('id', id).single();
          setProfile({ ...profileRes.data, social_links: (socialRes.data?.social_links as SocialLinks) ?? null });
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
  const avatar = profile.avatar_url ?? `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(profile.full_name)}`;
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
      toast({ title: 'Review deleted.' });
    }
    setDeletingReview(null);
  };

  const tabs: { key: TabType; icon: typeof Film; label: string }[] = [
    { key: 'reviews', icon: Film, label: 'Reviews' },
    { key: 'portfolio', icon: Grid3X3, label: 'Portfolio' },
    { key: 'client', icon: Users, label: 'By Clients' },
    { key: 'services', icon: Briefcase, label: 'Services' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
            <img src={donutLogo} alt="Glaze" className="h-7 w-7" />
            <span className="text-sm font-medium text-muted-foreground">Home</span>
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
        <div className="py-6">
          <div className="flex items-start gap-5">
            <img src={avatar} alt={profile.full_name} className="h-20 w-20 rounded-full bg-secondary shrink-0 object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-heading text-xl font-bold text-foreground truncate">{profile.full_name}</h1>
                {avgRating > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="text-sm font-semibold text-foreground">{avgRating}</span>
                  </div>
                )}
              </div>
              {profile.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-3.5 w-3.5" />{profile.location}
                </div>
              )}
              {profile.category && (
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{profile.category}</span>
              )}
            </div>
          </div>
          {profile.tagline && <p className="mt-4 text-sm text-foreground">{profile.tagline}</p>}
          {profile.social_links && Object.values(profile.social_links).some(Boolean) && (
            <div className="flex items-center gap-3 mt-3 flex-wrap">
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
          <div className="flex items-center gap-6 mt-4 py-3 border-t border-b border-border">
            <div className="text-center">
              <p className="text-base font-bold text-foreground">{dbPortfolio.length}</p>
              <p className="text-xs text-muted-foreground">Portfolio</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-foreground">{dbReviews.length}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-foreground">{dbServices.length}</p>
              <p className="text-xs text-muted-foreground">Services</p>
            </div>
            {canReview && id && (
              <div className="ml-auto">
                <ReviewUpload freelancerId={id} freelancerName={profile.full_name} freelancerAvatar={avatar} onReviewSubmitted={() => setRefreshKey(k => k + 1)} />
              </div>
            )}
          </div>
        </div>

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
          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              {dbReviews.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">No reviews yet.</p>
              )}

              {/* SECTION 1: Video Reviews */}
              {videoReviews.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Video Reviews <span className="text-muted-foreground font-normal">({videoReviews.length})</span>
                  </p>
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
                </div>
              )}

              {/* SECTION 2: Photo Reviews */}
              {photoReviews.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Photo Reviews <span className="text-muted-foreground font-normal">({photoReviews.length})</span>
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {photoReviews.map(review => (
                      <div key={review.id} className="relative aspect-square overflow-hidden rounded-md bg-secondary group cursor-pointer"
                        onClick={() => setDetailReview(review)}>
                        <img
                          src={review.photoUrl ?? review.mediaUrl ?? ''}
                          alt="Review"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <ReviewMenu review={review} userId={user?.id} onEdit={setEditingReview} onDelete={setDeletingReview} />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-[10px] text-background font-medium truncate">{review.clientName}</p>
                          <StarRow rating={review.rating} size="xs" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: Written Reviews */}
              {textReviews.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Written Reviews <span className="text-muted-foreground font-normal">({textReviews.length})</span>
                  </p>
                  <div className="space-y-3">
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

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div>
              {servicesLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading services...</p>
              ) : dbServices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No services listed yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2 py-2">
                  {dbServices.map(s => (
                    <Badge key={s.id} variant="secondary" className="text-sm px-3 py-1">{s.service_name}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Client Posts Tab */}
          {activeTab === 'client' && (
            <div className="space-y-4">
              {dbReviews.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No client posts yet.</p>
              )}
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

      {/* Edit Review dialog (controlled) */}
      {editingReview && id && (
        <ReviewUpload
          freelancerId={id}
          existingReview={editingReview}
          open={!!editingReview}
          onOpenChange={v => { if (!v) setEditingReview(null); }}
          onReviewSubmitted={() => { setEditingReview(null); setRefreshKey(k => k + 1); }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingReview} onOpenChange={v => { if (!v) setDeletingReview(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone. The review and any attached media will be permanently removed.</AlertDialogDescription>
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
