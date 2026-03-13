import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Plus, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useServices } from '@/hooks/useServices';
import { validateServiceName } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import donutLogo from '@/assets/donut-logo.png';

export default function FreelancerOnboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { services, loading, addService, removeService } = useServices(user?.id);
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = validateServiceName(input);
  const isDuplicate = services.some(
    s => s.service_name.toLowerCase() === input.trim().toLowerCase()
  );

  async function handleAdd() {
    if (validationError) { setError(validationError); return; }
    if (isDuplicate) { setError('That service is already added.'); return; }
    if (services.length >= 10) { setError('Maximum 10 services allowed.'); return; }
    setAdding(true);
    setError(null);
    const err = await addService(input.trim());
    setAdding(false);
    if (err) { setError(err); return; }
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <Link to="/" className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity cursor-pointer">
        <img src={donutLogo} alt="Glaze" className="h-8 w-8" />
        <span className="font-heading text-xl font-bold">Glaze</span>
        <Home className="h-4 w-4 text-muted-foreground ml-1" />
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>What services do you offer?</CardTitle>
          <CardDescription>Add the services clients can book you for. You can always update these later.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Wedding Photography"
              value={input}
              onChange={e => { setInput(e.target.value); setError(null); }}
              onKeyDown={handleKeyDown}
              disabled={adding}
            />
            <Button
              onClick={handleAdd}
              disabled={adding || !!validationError || isDuplicate || services.length >= 10}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services added yet. Add at least one to get started.</p>
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

          <Button
            className="w-full"
            disabled={services.length === 0}
            onClick={() => navigate(`/profile/${user?.id}`)}
          >
            Continue to Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
