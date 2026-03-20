import { Star, TrendingUp, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IconInstagram, IconLinkedIn } from '@/components/profile/SocialIcons';

export interface FreelancerCardData {
  id: string;
  name: string;
  username: string;
  avatar: string;
  service: string;
  rating: number;
  reviewCount: number;
  location: string;
  trending?: boolean;
  verifiedInstagram?: boolean;
  verifiedLinkedin?: boolean;
  verifiedIdentity?: boolean;
}

interface FreelancerCardProps {
  freelancer: FreelancerCardData;
  index: number;
}

const FreelancerCard = ({ freelancer, index }: FreelancerCardProps) => {
  const navigate = useNavigate();
  const hasVerification = freelancer.verifiedInstagram || freelancer.verifiedLinkedin || freelancer.verifiedIdentity;

  return (
    <div
      onClick={() => navigate(`/profile/${freelancer.id}`)}
      className="group cursor-pointer rounded-2xl bg-card p-4 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative mb-3">
        <img
          src={freelancer.avatar}
          alt={freelancer.name}
          className="h-20 w-20 rounded-full mx-auto bg-secondary object-cover"
        />
        {freelancer.trending && (
          <div className="absolute -top-1 -right-1 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            <TrendingUp className="h-3 w-3" />
            Hot
          </div>
        )}
      </div>

      <div className="text-center">
        <h3 className="font-heading text-base font-bold text-foreground truncate">
          {freelancer.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">@{freelancer.username}</p>

        {hasVerification && (
          <div className="flex items-center justify-center gap-1 mb-2 flex-wrap">
            {freelancer.verifiedInstagram && (
              <span className="flex items-center gap-0.5 rounded-full bg-blue-100 dark:bg-blue-950/30 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                <IconInstagram className="h-2.5 w-2.5" /> ✓
              </span>
            )}
            {freelancer.verifiedLinkedin && (
              <span className="flex items-center gap-0.5 rounded-full bg-blue-100 dark:bg-blue-950/30 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                <IconLinkedIn className="h-2.5 w-2.5" /> ✓
              </span>
            )}
            {freelancer.verifiedIdentity && (
              <span className="flex items-center gap-0.5 rounded-full bg-green-100 dark:bg-green-950/30 px-1.5 py-0.5 text-[9px] font-semibold text-green-600">
                <Shield className="h-2.5 w-2.5" /> ✓
              </span>
            )}
          </div>
        )}

        <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground mb-2">
          {freelancer.service}
        </span>

        <div className="flex items-center justify-center gap-1 mb-1">
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          <span className="text-sm font-semibold text-foreground">{freelancer.rating}</span>
          <span className="text-xs text-muted-foreground">({freelancer.reviewCount})</span>
        </div>

        <p className="text-xs text-muted-foreground">{freelancer.location || "New York"}</p>
      </div>
    </div>
  );
};

export default FreelancerCard;
