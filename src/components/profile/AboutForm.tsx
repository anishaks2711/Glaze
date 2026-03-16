import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { validateTagline } from '@/lib/validation';

interface Props {
  tagline: string;
  onTaglineChange: (v: string) => void;
  location: string;
  onLocationChange: (v: string) => void;
}

export default function AboutForm({ tagline, onTaglineChange, location, onLocationChange }: Props) {
  const [taglineError, setTaglineError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          value={tagline}
          onChange={e => {
            onTaglineChange(e.target.value);
            const r = validateTagline(e.target.value);
            setTaglineError(r.valid ? null : (r.error ?? null));
          }}
          maxLength={160}
          className="mt-1"
          placeholder="e.g. Award-winning wedding photographer"
        />
        {taglineError && <p className="text-xs text-destructive mt-1">{taglineError}</p>}
        <p className="text-xs text-muted-foreground mt-1">{tagline.length}/150</p>
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={e => onLocationChange(e.target.value)}
          className="mt-1"
          placeholder="e.g. Brooklyn, NY"
        />
      </div>
    </div>
  );
}
