import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { IconInstagram, IconTikTok, IconYouTube, IconX, IconLinkedIn, IconGlobe } from './SocialIcons';

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
}

interface Props {
  value: SocialLinks;
  onChange: (v: SocialLinks) => void;
}

const PLATFORMS = [
  { key: 'instagram' as const, label: 'Instagram',   icon: IconInstagram, placeholder: 'instagram.com/yourhandle' },
  { key: 'tiktok'    as const, label: 'TikTok',      icon: IconTikTok,    placeholder: 'tiktok.com/@yourhandle' },
  { key: 'youtube'   as const, label: 'YouTube',     icon: IconYouTube,   placeholder: 'youtube.com/@yourchannel' },
  { key: 'twitter'   as const, label: 'X / Twitter', icon: IconX,         placeholder: 'x.com/yourhandle' },
  { key: 'linkedin'  as const, label: 'LinkedIn',    icon: IconLinkedIn,  placeholder: 'linkedin.com/in/yourname' },
  { key: 'website'   as const, label: 'Website',     icon: IconGlobe,     placeholder: 'yourwebsite.com' },
];

export default function SocialLinksForm({ value, onChange }: Props) {
  function update(key: keyof SocialLinks, raw: string) {
    onChange({ ...value, [key]: raw.trim() || undefined });
  }

  return (
    <div className="space-y-3">
      <Label>Social Links <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
      {PLATFORMS.map(({ key, label, icon: Icon, placeholder }) => (
        <div key={key} className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder={placeholder}
            value={value[key] ?? ''}
            onChange={e => update(key, e.target.value)}
            className="text-sm"
            aria-label={label}
          />
        </div>
      ))}
    </div>
  );
}
