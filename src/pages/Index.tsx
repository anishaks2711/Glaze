import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import donutLogo from '@/assets/Donut.svg';
import donutBg1 from '@/assets/DonutBg1.png';
import FreelancerCard, { FreelancerCardData } from '@/components/FreelancerCard';
import ServiceFilter from '@/components/ServiceFilter';
import { UserMenu } from '@/components/UserMenu';
import { useFreelancers } from '@/hooks/useFreelancers';
import { useAuth } from '@/hooks/useAuth';

const FILTER_CHIPS = ['All', 'Florist', 'Event Planner', 'Baker', 'Hair Stylist', 'MC', 'Other'];

function categoryMatches(dbCategory: string | null, chip: string): boolean {
  if (!dbCategory) return false;
  const db = dbCategory.toLowerCase();
  const c = chip.toLowerCase();
  if (db === c) return true;
  if (db.includes(c) || c.includes(db)) return true;
  const stem = c.length > 4 ? c.slice(0, -1) : c;
  return db.startsWith(stem);
}

const Index = () => {
  const [selectedService, setSelectedService] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { user } = useAuth();
  const browseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { freelancers, loading, error } = useFreelancers(debouncedSearch);

  const filterChips = FILTER_CHIPS;

  const cards: FreelancerCardData[] = useMemo(() => {
    const filtered =
      selectedService === 'All'
        ? freelancers
        : freelancers.filter((f) => categoryMatches(f.category, selectedService));
    return filtered.map((f) => ({
      id: f.id,
      name: f.full_name,
      username: f.full_name.toLowerCase().replace(/\s+/g, ''),
      avatar:
        f.avatar_url ??
        `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(f.full_name)}`,
      service: f.category ?? '',
      rating: f.avgRating,
      reviewCount: f.reviewCount,
      location: f.location ?? '',
    }));
  }, [freelancers, selectedService]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={donutLogo} alt="Glaze" className="h-8 w-8" />
          <h1 className="font-fredoka text-2xl font-bold text-foreground tracking-tight">Glaze</h1>
          <div className="ml-auto flex items-center gap-2">
            {!user && (
              <Link to="/login" className="text-sm font-medium text-primary hover:underline px-2">
                Sign In
              </Link>
            )}
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Hero — only shown when signed out */}
      {!user && (
        <section className="relative flex flex-col items-center justify-center min-h-[calc(100vh-57px)] px-4 text-center overflow-hidden">

          {/* Background atmosphere */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/12 blur-[160px]" />
            <div className="absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full bg-accent/8 blur-[120px]" />
            <div className="absolute -left-20 bottom-0 h-[350px] w-[350px] rounded-full bg-primary/8 blur-[100px]" />
            {/* Dot grid */}
            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{ backgroundImage: 'radial-gradient(circle, hsl(20 15% 15%) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
            />
          </div>

          {/* DonutBg1 background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <img src={donutBg1} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Brand name */}
            <h2 className="font-fredoka text-7xl sm:text-8xl font-bold tracking-tight mb-3 px-4 py-1"
              style={{ background: 'linear-gradient(135deg, hsl(20,15%,15%) 40%, hsl(22,97%,44%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Glaze
            </h2>

            {/* Tagline */}
            <p
              className="text-lg sm:text-xl font-semibold mb-8"
              style={{ background: 'linear-gradient(135deg, hsl(22,97%,44%), hsl(340,75%,65%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Vouched, Verified, Visible.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mb-8">
              <Link
                to="/signup?role=freelancer"
                className="flex-1 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white text-center hover:opacity-90 active:scale-95 transition-all shadow-lg"
                style={{ background: 'linear-gradient(135deg, hsl(22,97%,44%), hsl(340,75%,65%))' }}
              >
                Join as Freelancer
              </Link>
              <Link
                to="/signup?role=client"
                className="flex-1 rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-6 py-3.5 text-sm font-semibold text-foreground text-center hover:bg-secondary active:scale-95 transition-all"
              >
                Explore as Client
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>✓ Verified reviews</span>
              <span className="w-px h-3 bg-border inline-block" />
              <span>✓ Real clients only</span>
              <span className="w-px h-3 bg-border inline-block" />
              <span>✓ Free to browse</span>
            </div>
          </div>

          {/* Scroll indicator */}
          <button
            onClick={() => browseRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-8 flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-xs tracking-widest uppercase opacity-60">Browse</span>
            <ChevronDown className="h-5 w-5 animate-bounce" />
          </button>
        </section>
      )}

      {/* Browse section */}
      <div ref={browseRef} className="container max-w-5xl mx-auto px-4 py-6 space-y-8">
        <ServiceFilter
          selectedService={selectedService}
          onServiceChange={setSelectedService}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          services={filterChips}
        />

        <section>
          {(selectedService !== 'All' || debouncedSearch) && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold text-foreground">
                {selectedService !== 'All' ? selectedService : 'Results'}
              </h2>
              {!loading && (
                <span className="text-sm text-muted-foreground">{cards.length} found</span>
              )}
            </div>
          )}

          {selectedService === 'All' && !debouncedSearch && (
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              All Freelancers
            </h2>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-card p-4 h-48 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">{error}</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">No freelancers found</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search or filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cards.map((f, i) => (
                <div key={f.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <FreelancerCard freelancer={f} index={i} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Index;
