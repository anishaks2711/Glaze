import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import donutLogo from '@/assets/donut-logo.png';
import FreelancerCard, { FreelancerCardData } from '@/components/FreelancerCard';
import ServiceFilter from '@/components/ServiceFilter';
import { UserMenu } from '@/components/UserMenu';
import { useFreelancers } from '@/hooks/useFreelancers';
import { useAuth } from '@/hooks/useAuth';
import { FREELANCER_CATEGORIES } from '@/lib/constants';

const FILTER_CHIPS = ['All', ...FREELANCER_CATEGORIES];

// "Photography" chip should match DB values like "Photographer", "Photography", etc.
function categoryMatches(dbCategory: string | null, chip: string): boolean {
  if (!dbCategory) return false;
  const db = dbCategory.toLowerCase();
  const c = chip.toLowerCase();
  if (db === c) return true;
  if (db.includes(c) || c.includes(db)) return true;
  // Stem match: "photography" → "photograph" matches "photographer"
  const stem = c.length > 4 ? c.slice(0, -1) : c;
  return db.startsWith(stem);
}

const Index = () => {
  const [selectedService, setSelectedService] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { freelancers, loading, error } = useFreelancers(debouncedSearch);

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
          <img src={donutLogo} alt="Glaze" className="h-10 w-10" />
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">
            Glaze
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {!user && (
              <Link
                to="/login"
                className="text-sm font-medium text-primary hover:underline px-2"
              >
                Sign In
              </Link>
            )}
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Search & Filter */}
        <ServiceFilter
          selectedService={selectedService}
          onServiceChange={setSelectedService}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          services={FILTER_CHIPS}
        />

        {/* Results */}
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
              <p className="text-sm text-muted-foreground mt-1">
                Try a different search or filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cards.map((f, i) => (
                <div
                  key={f.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <FreelancerCard freelancer={f} index={i} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
