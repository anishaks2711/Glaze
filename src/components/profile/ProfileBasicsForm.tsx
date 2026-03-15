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

interface Props {
  fullName: string;
  onFullNameChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
}

export default function ProfileBasicsForm({
  fullName,
  onFullNameChange,
  category,
  onCategoryChange,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullName">
          Full Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={e => onFullNameChange(e.target.value)}
          placeholder="e.g. Jane Smith"
          className="mt-1"
        />
      </div>
      <div>
        <Label>
          Category <span className="text-destructive">*</span>
        </Label>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select your category" />
          </SelectTrigger>
          <SelectContent>
            {FREELANCER_CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!category && (
          <p className="text-xs text-muted-foreground mt-1">Required to continue</p>
        )}
      </div>
    </div>
  );
}
