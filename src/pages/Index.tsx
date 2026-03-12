import { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import donutLogo from '@/assets/donut-logo.png';
import { freelancers } from '@/data/mockData';
import FreelancerCard from '@/components/FreelancerCard';
import ServiceFilter from '@/components/ServiceFilter';
import { UserMenu } from '@/components/UserMenu';

const Index = () => {
  const [selectedService, setSelectedService] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return freelancers.filter((f) => {
      const matchesService = selectedService === 'All' || f.service === selectedService;
      const matchesSearch =
        !searchQuery ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.username.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesService && matchesSearch;
    });
  }, [selectedService, searchQuery]);

  const trending = filtered.filter((f) => f.trending);
  const others = filtered.filter((f) => !f.trending);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={donutLogo} alt="Glaze" className="h-10 w-10" />
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">
            Glaze
          </h1>
          <div className="ml-auto">
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
        />

        {/* Trending Section */}
        {trending.length > 0 && selectedService === 'All' && !searchQuery && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Trending Now</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {trending.map((f, i) => (
                <div key={f.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <FreelancerCard freelancer={f} index={i} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All / Filtered Results */}
        <section>
          {(selectedService !== 'All' || searchQuery) && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold text-foreground">
                {selectedService !== 'All' ? selectedService : 'Results'}
              </h2>
              <span className="text-sm text-muted-foreground">{filtered.length} found</span>
            </div>
          )}

          {selectedService === 'All' && !searchQuery && others.length > 0 && (
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              All Freelancers
            </h2>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {(selectedService !== 'All' || searchQuery ? filtered : others).map((f, i) => (
              <div key={f.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <FreelancerCard freelancer={f} index={i} />
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">No freelancers found</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search or filter</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
