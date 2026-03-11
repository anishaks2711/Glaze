import { Search } from 'lucide-react';
import { services } from '@/data/mockData';

interface ServiceFilterProps {
  selectedService: string;
  onServiceChange: (service: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const ServiceFilter = ({ selectedService, onServiceChange, searchQuery, onSearchChange }: ServiceFilterProps) => {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search freelancers..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-2xl border border-input bg-card py-3 pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      {/* Service Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {services.map((service) => (
          <button
            key={service}
            onClick={() => onServiceChange(service)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              selectedService === service
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {service}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ServiceFilter;
