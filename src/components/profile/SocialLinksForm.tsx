import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { IconInstagram, IconTikTok, IconYouTube, IconX, IconLinkedIn, IconGlobe } from './SocialIcons';

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
}

interface PlatformConfig {
  key: Exclude<keyof SocialLinks, 'website'>;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  displayPrefix: string;
  urlBase: string;
  placeholder: string;
}

const PLATFORMS: PlatformConfig[] = [
  { key: 'instagram', label: 'Instagram',   icon: IconInstagram, displayPrefix: 'instagram.com/',    urlBase: 'https://instagram.com/',    placeholder: 'yourusername' },
  { key: 'tiktok',    label: 'TikTok',      icon: IconTikTok,    displayPrefix: 'tiktok.com/@',      urlBase: 'https://tiktok.com/@',      placeholder: 'yourusername' },
  { key: 'youtube',   label: 'YouTube',     icon: IconYouTube,   displayPrefix: 'youtube.com/@',     urlBase: 'https://youtube.com/@',     placeholder: 'yourusername' },
  { key: 'twitter',   label: 'X / Twitter', icon: IconX,         displayPrefix: 'x.com/',            urlBase: 'https://x.com/',            placeholder: 'yourusername' },
  { key: 'linkedin',  label: 'LinkedIn',    icon: IconLinkedIn,  displayPrefix: 'linkedin.com/in/',  urlBase: 'https://linkedin.com/in/',  placeholder: 'yourprofile'  },
];

export function extractUsername(input: string, urlPrefix: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('@')) return trimmed.slice(1);
  const idx = trimmed.indexOf(urlPrefix);
  if (idx !== -1) return trimmed.slice(idx + urlPrefix.length).replace(/\/$/, '');
  return trimmed;
}

function buildLinks(usernames: Record<string, string>, website: string): SocialLinks {
  const links: SocialLinks = {};
  for (const p of PLATFORMS) {
    const u = (usernames[p.key] ?? '').trim();
    if (u) links[p.key] = `${p.urlBase}${u}`;
  }
  const t = website.trim();
  if (t) links.website = t.startsWith('http') ? t : `https://${t}`;
  return links;
}

interface Props {
  value: SocialLinks;
  onChange: (v: SocialLinks) => void;
}

export default function SocialLinksForm({ value, onChange }: Props) {
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [websiteUrl, setWebsiteUrl] = useState('');
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    const hasContent = Object.values(value).some(Boolean);
    if (!hasContent) return;
    initialized.current = true;
    const parsed: Record<string, string> = {};
    for (const p of PLATFORMS) {
      const url = value[p.key];
      if (url) parsed[p.key] = extractUsername(url, p.displayPrefix);
    }
    setUsernames(parsed);
    setWebsiteUrl(value.website ?? '');
  }, [value]);

  function handleUsernameChange(key: string, raw: string, displayPrefix: string) {
    const username = extractUsername(raw, displayPrefix);
    const next = { ...usernames, [key]: username };
    setUsernames(next);
    onChange(buildLinks(next, websiteUrl));
  }

  function handleWebsiteChange(raw: string) {
    setWebsiteUrl(raw);
    onChange(buildLinks(usernames, raw));
  }

  return (
    <div className="space-y-3">
      <Label>Social Links</Label>
      {PLATFORMS.map(({ key, label, icon: Icon, displayPrefix, placeholder }) => (
        <div key={key}>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5" />{label}
          </p>
          <div className="flex items-center border rounded-md overflow-hidden">
            <span className="px-3 py-2 bg-muted text-sm text-muted-foreground border-r whitespace-nowrap">
              {displayPrefix}
            </span>
            <input
              value={usernames[key] ?? ''}
              onChange={e => handleUsernameChange(key, e.target.value, displayPrefix)}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
              aria-label={label}
            />
          </div>
        </div>
      ))}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Website</p>
        <div className="flex items-center border rounded-md overflow-hidden">
          <IconGlobe className="h-4 w-4 text-muted-foreground shrink-0 ml-3" />
          <input
            value={websiteUrl}
            onChange={e => handleWebsiteChange(e.target.value)}
            placeholder="www.yoursite.com"
            className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
            aria-label="Website"
          />
        </div>
      </div>
    </div>
  );
}
