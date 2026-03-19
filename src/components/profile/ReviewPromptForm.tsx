import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { validateReviewPrompt } from '@/lib/validation';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const PLACEHOLDER = 'e.g. Please mention the event type, what you liked most, and if you\'d recommend me to others';

export default function ReviewPromptForm({ value, onChange }: Props) {
  const error = validateReviewPrompt(value).error;

  return (
    <div className="space-y-2">
      <Label htmlFor="reviewPrompt">Custom Prompt</Label>
      <Textarea
        id="reviewPrompt"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={PLACEHOLDER}
        maxLength={510}
        rows={4}
        className="resize-none"
      />
      {error
        ? <p className="text-xs text-destructive">{error}</p>
        : <p className="text-xs text-muted-foreground">{value.length}/500 — leave blank to use the default prompt</p>
      }
    </div>
  );
}
