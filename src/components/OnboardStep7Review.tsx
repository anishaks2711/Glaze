import type { SocialLinks } from '@/components/profile/SocialLinksForm';
import { Button } from '@/components/ui/button';
import donutLogo from '@/assets/donut-logo.png';

interface PortfolioPhoto { preview: string; caption: string | null; }

interface Props {
  fullName: string;
  username: string;
  category: string;
  avatarPreview: string | null;
  isShy: boolean;
  tagline: string;
  location: string;
  socialLinks: SocialLinks;
  services: { id: string; service_name: string }[];
  portfolioPhotos: PortfolioPhoto[];
  reviewPrompt: string;
  verifiedInstagram: boolean;
  verifiedLinkedin: boolean;
  verifiedIdentity: boolean;
  onEdit: (step: number) => void;
  onComplete: () => void;
  finishing: boolean;
}

function Section({ label, step, onEdit, children }: {
  label: string; step: number; onEdit: (s: number) => void; children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg p-3 space-y-1">
      <div className="flex justify-between items-center">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <button onClick={() => onEdit(step)} className="text-xs text-primary hover:underline">Edit</button>
      </div>
      {children}
    </div>
  );
}

export default function OnboardStep7Review({
  fullName, username, category, avatarPreview, isShy, tagline, location,
  socialLinks, services, portfolioPhotos, reviewPrompt,
  verifiedInstagram, verifiedLinkedin, verifiedIdentity,
  onEdit, onComplete, finishing,
}: Props) {
  const filledLinks = Object.values(socialLinks).filter(v => v?.trim()).length;
  const avatarSrc = isShy ? donutLogo : avatarPreview;

  return (
    <div className="space-y-3">
      <Section label="Profile Photo" step={2} onEdit={onEdit}>
        <div className="flex items-center gap-3">
          {avatarSrc
            ? <img src={avatarSrc} alt="Avatar" className="h-12 w-12 rounded-full object-cover" />
            : <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-xl">👤</div>
          }
          <div>
            {isShy && <p className="text-xs text-muted-foreground">I'm Shy mode — donut shown publicly</p>}
            {!avatarPreview && !isShy && <p className="text-xs text-muted-foreground">No photo uploaded</p>}
            {avatarPreview && !isShy && <p className="text-xs text-muted-foreground">Photo uploaded</p>}
          </div>
        </div>
      </Section>

      <Section label="Profile Basics" step={1} onEdit={onEdit}>
        <p className="text-sm font-medium">{fullName}</p>
        <p className="text-xs text-muted-foreground">@{username} · {category}</p>
      </Section>

      <Section label="About" step={3} onEdit={onEdit}>
        {tagline
          ? <p className="text-sm">{tagline}</p>
          : <p className="text-xs text-muted-foreground">No tagline</p>}
        {location && <p className="text-xs text-muted-foreground">{location}</p>}
        <p className="text-xs text-muted-foreground">
          {filledLinks > 0 ? `${filledLinks} social link${filledLinks > 1 ? 's' : ''} added` : 'No social links'}
        </p>
      </Section>

      <Section label="Verification" step={3} onEdit={onEdit}>
        {verifiedInstagram || verifiedLinkedin || verifiedIdentity ? (
          <p className="text-sm">
            {[verifiedInstagram && 'Instagram', verifiedLinkedin && 'LinkedIn', verifiedIdentity && 'Identity'].filter(Boolean).join(', ')} verified
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">No verifications selected</p>
        )}
      </Section>

      <Section label="Services" step={4} onEdit={onEdit}>
        {services.length > 0
          ? <p className="text-sm">{services.map(s => s.service_name).join(', ')}</p>
          : <p className="text-xs text-muted-foreground">No services added</p>}
      </Section>

      <Section label="Portfolio" step={5} onEdit={onEdit}>
        {portfolioPhotos.length > 0 ? (
          <div className="flex gap-1 flex-wrap items-center">
            {portfolioPhotos.slice(0, 4).map((p, i) => (
              <img key={i} src={p.preview} alt="" className="h-10 w-10 rounded object-cover" />
            ))}
            {portfolioPhotos.length > 4 && (
              <span className="text-xs text-muted-foreground">+{portfolioPhotos.length - 4} more</span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No portfolio photos</p>
        )}
      </Section>

      <Section label="Review Prompt" step={6} onEdit={onEdit}>
        {reviewPrompt
          ? <p className="text-sm line-clamp-2">{reviewPrompt}</p>
          : <p className="text-xs text-muted-foreground">Using default prompt</p>}
      </Section>

      <Button className="w-full" onClick={onComplete} disabled={finishing}>
        {finishing ? 'Saving your profile...' : 'Complete Profile'}
      </Button>
    </div>
  );
}
