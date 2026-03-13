import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Grid3X3, Film, Users, Play, Briefcase, Pencil } from 'lucide-react';
import { freelancers } from '@/data/mockData';
import donutLogo from '@/assets/donut-logo.png';
import ReelViewer from '@/components/ReelViewer';
import { useServices } from '@/hooks/useServices';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { UserMenu } from '@/components/UserMenu';

type TabType = 'reviews' | 'portfolio' | 'client' | 'services';

const FreelancerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('reviews');
  const [reelOpen, setReelOpen] = useState(false);
  const [reelStartIndex, setReelStartIndex] = useState(0);

  const mockFreelancer = freelancers.find((f) => f.id === id);
  const { services: dbServices, loading: servicesLoading } = useServices(id);
  const { portfolio: dbPortfolio, loading: portfolioLoading } = usePortfolio(id);
  const isOwner = user?.id === id;
  const [realProfile, setRealProfile] = useState<{
    full_name: string; avatar_url: string | null; tagline: string | null; category: string | null; location: string | null;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(!mockFreelancer);

  useEffect(() => {
    if (mockFreelancer || !id) return;
    setProfileLoading(true);
    supabase.from('profiles').select('full_name, avatar_url, tagline, category, location').eq('id', id).single()
      .then(({ data }) => { setRealProfile(data); setProfileLoading(false); });
  }, [id, mockFreelancer]);

  const freelancer = mockFreelancer ?? (realProfile ? {
    id: id!,
    name: realProfile.full_name,
    username: realProfile.full_name.toLowerCase().replace(/\s+/g, ''),
    avatar: realProfile.avatar_url ?? '',
    rating: 0,
    location: realProfile.location ?? '',
    service: realProfile.category ?? '',
    bio: realProfile.tagline ?? '',
    postsCount: 0,
    followers: 0,
    following: 0,
    reviewCount: 0,
    tags: [],
    reviews: [],
    portfolio: [],
    clientPosts: [],
  } : null);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Freelancer not found</p>
      </div>
    );
  }

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

  const formatNumber = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

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
            @{freelancer.username}
          </span>
          {isOwner && (
            <Link
              to="/edit-profile"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md border border-border"
            >
              <Pencil className="h-3 w-3" /> Edit Profile
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
              src={freelancer.avatar}
              alt={freelancer.name}
              className="h-20 w-20 rounded-full bg-secondary shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-heading text-xl font-bold text-foreground truncate">
                  {freelancer.name}
                </h1>
                <div className="flex items-center gap-0.5">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-sm font-semibold text-foreground">{freelancer.rating}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3.5 w-3.5" />
                {freelancer.location}
              </div>

              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {freelancer.service}
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm text-foreground">{freelancer.bio}</p>

          {/* Stats Row */}
          <div className="flex gap-6 mt-4 py-3 border-t border-b border-border">
            <div className="text-center">
              <p className="text-base font-bold text-foreground">{formatNumber(freelancer.postsCount)}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-foreground">{formatNumber(freelancer.followers)}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-foreground">{formatNumber(freelancer.following)}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-foreground">{freelancer.reviewCount}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {freelancer.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
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
          {/* Reviews Tab - Video Grid */}
          {activeTab === 'reviews' && (
            <div className="grid grid-cols-3 gap-1">
              {freelancer.reviews.map((review, idx) => (
                <div
                  key={review.id}
                  onClick={() => openReel(idx)}
                  className="relative aspect-[9/16] cursor-pointer overflow-hidden rounded-md bg-secondary group"
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, hsl(${22 + idx * 15}, 80%, ${35 + idx * 5}%), hsl(${340 - idx * 10}, 70%, ${50 + idx * 3}%))`,
                    }}
                  />
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

          {/* Portfolio Tab — DB-first, mock fallback for demo freelancers */}
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
              ) : mockFreelancer && mockFreelancer.portfolio.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {mockFreelancer.portfolio.map((item) => (
                    <div key={item.id} className="relative aspect-square cursor-pointer overflow-hidden rounded-md bg-secondary group">
                      <img
                        src={item.thumbnail}
                        alt={item.caption}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {item.type === 'video' && (
                        <div className="absolute top-2 right-2">
                          <Play className="h-4 w-4 text-background drop-shadow-md" />
                        </div>
                      )}
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
            <div className="grid grid-cols-3 gap-1">
              {freelancer.clientPosts.map((item) => (
                <div
                  key={item.id}
                  className="relative aspect-square cursor-pointer overflow-hidden rounded-md bg-secondary group"
                >
                  <img
                    src={item.thumbnail}
                    alt={item.caption}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {item.type === 'video' && (
                    <div className="absolute top-2 right-2">
                      <Play className="h-4 w-4 text-background drop-shadow-md" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Reel Viewer */}
      {reelOpen && (
        <ReelViewer
          reviews={freelancer.reviews}
          startIndex={reelStartIndex}
          onClose={() => setReelOpen(false)}
        />
      )}
    </div>
  );
};

export default FreelancerProfile;
