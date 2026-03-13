import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { validateServiceName } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Props {
  freelancerId: string | undefined;
}

export default function ServiceForm({ freelancerId }: Props) {
  const { services, loading, addService, removeService } = useServices(freelancerId);
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationResult = validateServiceName(input);
  const isDuplicate = services.some(
    s => s.service_name.toLowerCase() === input.trim().toLowerCase()
  );

  async function handleAdd() {
    if (!validationResult.valid) { setError(validationResult.error ?? 'Invalid service name'); return; }
    if (isDuplicate) { setError('That service is already added.'); return; }
    if (services.length >= 10) { setError('Maximum 10 services allowed.'); return; }
    setAdding(true);
    setError(null);
    const err = await addService(input.trim());
    setAdding(false);
    if (err) { setError(err); return; }
    setInput('');
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="e.g. Wedding Photography"
          value={input}
          onChange={e => { setInput(e.target.value); setError(null); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          disabled={adding}
        />
        <Button
          onClick={handleAdd}
          disabled={adding || !validationResult.valid || isDuplicate || services.length >= 10}
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : services.length === 0 ? (
        <p className="text-sm text-muted-foreground">No services added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {services.map(s => (
            <Badge key={s.id} variant="secondary" className="flex items-center gap-1 pr-1">
              {s.service_name}
              <button
                onClick={() => removeService(s.id)}
                className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
