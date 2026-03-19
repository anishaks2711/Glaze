import { useEffect, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FREELANCER_CATEGORIES } from '@/lib/constants';
import { validateUsername } from '@/lib/validation';

interface Props {
  fullName: string;
  onFullNameChange: (v: string) => void;
  username?: string;
  onUsernameChange?: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
}

function generateUsername(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9._-]/g, '').slice(0, 30);
}

const PREDEFINED = FREELANCER_CATEGORIES.filter(c => c !== 'Other');

export default function ProfileBasicsForm({
  fullName, onFullNameChange, username, onUsernameChange, category, onCategoryChange,
}: Props) {
  const touchedRef = useRef(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isOther, setIsOther] = useState(() => !!category && !PREDEFINED.includes(category as never));

  // Auto-generate username from fullName until user manually edits it (only when onUsernameChange is provided)
  useEffect(() => {
    if (onUsernameChange && !touchedRef.current) {
      onUsernameChange(generateUsername(fullName));
    }
  }, [fullName]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleUsernameChange(v: string) {
    touchedRef.current = true;
    onUsernameChange?.(v);
    const r = validateUsername(v);
    setUsernameError(r.valid ? null : (r.error ?? null));
  }

  const dropdownValue = isOther ? 'Other' : (PREDEFINED.includes(category as never) ? category : '');
  const showOtherInput = isOther;

  function handleDropdownChange(v: string) {
    if (v !== 'Other') {
      setIsOther(false);
      onCategoryChange(v);
    } else {
      setIsOther(true);
      onCategoryChange('');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={e => onFullNameChange(e.target.value)}
          placeholder="e.g. Jane Smith"
          className="mt-1"
        />
      </div>
      {onUsernameChange !== undefined && (
        <div>
          <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
          <Input
            id="username"
            value={username ?? ''}
            onChange={e => handleUsernameChange(e.target.value)}
            placeholder="e.g. jane.smith"
            className="mt-1"
          />
          {usernameError
            ? <p className="text-xs text-destructive mt-1">{usernameError}</p>
            : username && <p className="text-xs text-muted-foreground mt-1">glaze.app/@{username}</p>}
        </div>
      )}
      <div>
        <Label>Category <span className="text-destructive">*</span></Label>
        <Select value={dropdownValue} onValueChange={handleDropdownChange}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select your category" />
          </SelectTrigger>
          <SelectContent>
            {FREELANCER_CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showOtherInput && (
          <Input
            className="mt-2"
            placeholder="Enter your category (e.g. Calligrapher)"
            value={category}
            onChange={e => onCategoryChange(e.target.value)}
            maxLength={50}
          />
        )}
        {!category && (
          <p className="text-xs text-muted-foreground mt-1">Required to continue</p>
        )}
      </div>
    </div>
  );
}
