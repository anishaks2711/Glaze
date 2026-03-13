import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Grid3X3, Film, Users, Play, Briefcase, Pencil } from 'lucide-react';
import donutLogo from '@/assets/donut-logo.png';
import ReelViewer, { ReviewItem } from '@/components/ReelViewer';
import { useServices } from '@/hooks/useServices';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { UserMenu } from '@/components/UserMenu';

type TabType = 'reviews' | 'portfolio' | 'client' | 'services';

interface DbProfile {
  full_name: string;
  avatar_url: string | null;
  tagline: string | null;
  category: string | null;
  location: string | null;
}

const FreelancerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('reviews');
  const [reelOpen, setReelOpen] = useState(false);
  const [reelStartIndex, setReelStartIndex] = useState(0);

  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [dbReviews, setDbReviews] = useState<ReviewItem[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);

  const { services: dbServices, loading: servicesLoading } = useServices(id);
  const { portfolio: dbPortfolio, loading: portfolioLoading } = usePortfolio(id);
  const isOwner = user?.id === id;

  useEffect(() => {
    if (!id) return;
    setProfileLoading(true);

    const fetchAll = async () => {
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name, avatar_url, tagline, category, location')
            .eq('id', id)
            .single(),
          supabase
            .from('reviews')
            .select('id, rating, text_content, media_url, media_type, profiles!reviews_client_id_fkey(full_name, avatar_url)')
            .eq('freelancer_id', id)
            .order('created_at', { ascending: false }),
        ]);

        if (profileRes.data) setProfile(profileRes.data);

        const reviews: ReviewItem[] = (reviewsRes.data ?? []).map((r: any) => ({
          id: r.id,
          clientName: r.profiles?.full_name ?? 'Anonymous',
          clientAvatar: r.profiles?.avatar_url ?? '',
          rating: r.rating,
          text: r.text_content ?? '',
          mediaUrl: r.media_url,
          mediaType: r.media_type,
        }));
        setDbReviews(reviews);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchAll();
  }, [id]);

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
  const avatar =
    profile.avatar_url ??
    `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(profile.full_name)}`;
  const avgRating =
    dbReviews.length > 0
      ? Math.round((dbReviews.reduce((sum, r) => sum + r.rating, 0) / dbReviews.length) * 10) / 10
      : 0;

  const openReel = (index: number) => {
    setReelStartIndex(index);
    setReelOpen(true);
  };

  const tabs: { key: TabType; icon: typeof Film; label: string }[] = [
    { key: 'reviews', icon: Film, label: 'Reviews' },
    { key: 'portfolio', icon: Grid3X3, label: 'Portfolio' },
    { key: 'client', icon: Users, label: 'By Clients' },
    { key: 'services', icon: Briefcase, label: 'Services' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
            <img src={donutLogo} alt="Glaze" className="h-7 w-7" />
            <span className="text-sm font-medium text-muted-foreground">Home</span>
          </Link>
          <span className="font-heading text-lg font-bold text-foreground flex-1">
            @{username}
          </span>
          {isOwner && (
            <Link
              to="/edit-profile"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md border border-border"
            >
              <Pencil className="h-3 w-3" /> Edit Profile
            </Link>
          )}
          {!user && (
            <Link to="/login" className="text-sm font-medium text-primary hover:underline px-2">
              Sign In
            </Link>
          )}
          <UserMenu />
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4">
        {/* Profile Info */}
        <div className="py-6">
          <div className="flex items-start gap-5">
            <img
              src={avatar}
              alt={profile.full_name}
              className="h-20 w-20 rounded-full bg-secondary shrink-0 object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-heading text-xl font-bold text-foreground truncate">
                  {profile.full_name}
                </h1>
                {avgRating > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="text-sm font-semibold text-foreground">{avgRating}</span>
                  </div>
                )}
              </div>

              {profile.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.location}
                </div>
              )}

              {profile.category && (
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {profile.category}
                </span>
              )}
            </div>
          </div>

          {profile.tagline && (
            <p className="mt-4 text-sm text-foreground">{profile.tagline}</p>
          )}

          {/* Stats Row */}
          <div className="flex gap-6 mt-4 py-3 border-t border-b border-border">
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
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-4">
          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              {dbReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No reviews yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {dbReviews.map((review, idx) => (
                    <div
                      key={review.id}
                      onClick={() => openReel(idx)}
                      className="relative aspect-[9/16] cursor-pointer overflow-hidden rounded-md bg-secondary group"
                    >
                      {review.mediaUrl && review.mediaType === 'image' ? (
                        <img
                          src={review.mediaUrl}
                          alt="Review"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : review.mediaUrl && review.mediaType === 'video' ? (
                        <video
                          src={review.mediaUrl}
                          className="absolute inset-0 h-full w-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(135deg, hsl(${22 + idx * 15}, 80%, ${35 + idx * 5}%), hsl(${340 - idx * 10}, 70%, ${50 + idx * 3}%))`,
                          }}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                        <Play className="h-8 w-8 text-background fill-background" />
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-[10px] text-background font-medium truncate">
                          {review.clientName}
                        </p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: review.rating }, (_, i) => (
                            <Star key={i} className="h-2.5 w-2.5 fill-primary text-primary" />
                          ))}
                        </div>
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
                <div className="grid grid-cols-3 gap-1">
                  {dbPortfolio.map(item => (
                    <div key={item.id} className="relative aspect-square overflow-hidden rounded-md bg-secondary">
                      <img src={item.image_url} alt={item.caption ?? ''} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
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
                    <Badge key={s.id} variant="secondary" className="text-sm px-3 py-1">
                      {s.service_name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Client Posts Tab */}
          {activeTab === 'client' && (
            <p className="text-sm text-muted-foreground py-8 text-center">No client posts yet.</p>
          )}
        </div>
      </main>

      {/* Reel Viewer */}
      {reelOpen && (
        <ReelViewer
          reviews={dbReviews}
          startIndex={reelStartIndex}
          onClose={() => setReelOpen(false)}
        />
      )}
    </div>
  );
};

export default FreelancerProfile;
