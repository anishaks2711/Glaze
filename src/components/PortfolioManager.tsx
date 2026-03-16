import { useState, useRef } from 'react';
import { Trash2, ImagePlus, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePortfolio } from '@/hooks/usePortfolio';
import { validatePortfolioFile } from '@/lib/validation';

interface Props {
  freelancerId: string | undefined;
}

interface PendingPhoto {
  file: File;
  previewUrl: string;
  caption: string;
}

export default function PortfolioManager({ freelancerId }: Props) {
  const { portfolio, loading, addPhoto, deletePhoto } = usePortfolio(freelancerId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<PendingPhoto[]>([]);

  function handleFiles(files: FileList) {
    setError(null);
    const validated: PendingPhoto[] = [];
    for (const file of Array.from(files)) {
      const v = validatePortfolioFile(file);
      if (!v.valid) { setError(v.error ?? 'Invalid file'); return; }
      validated.push({ file, previewUrl: URL.createObjectURL(file), caption: '' });
    }
    setPending(prev => [...prev, ...validated]);
    if (fileRef.current) fileRef.current.value = '';
  }

  function removePending(index: number) {
    setPending(prev => prev.filter((_, i) => i !== index));
  }

  function updateCaption(index: number, caption: string) {
    setPending(prev => prev.map((p, i) => i === index ? { ...p, caption } : p));
  }

  async function uploadPending() {
    if (pending.length === 0) return;
    setError(null);
    setUploading(true);
    for (let i = 0; i < pending.length; i++) {
      const { file, caption } = pending[i];
      const err = await addPhoto(file, caption.trim() || null, portfolio.length + i);
      if (err) { setError('Upload failed. Please try again.'); setUploading(false); return; }
    }
    setPending([]);
    setUploading(false);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Existing photos */}
      {portfolio.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {portfolio.map(item => (
            <div key={item.id} className="relative rounded-md overflow-hidden group">
              <div className="aspect-square">
                <img src={item.image_url} alt={item.caption ?? ''} className="h-full w-full object-cover" />
              </div>
              {item.caption && (
                <p className="text-xs text-muted-foreground truncate px-1 pt-1">{item.caption}</p>
              )}
              <button
                onClick={() => deletePhoto(item.id)}
                className="absolute top-1 right-1 rounded-full bg-background/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {portfolio.length === 0 && pending.length === 0 && (
        <p className="text-sm text-muted-foreground">No portfolio photos yet.</p>
      )}

      {/* Pending photos with caption inputs */}
      {pending.length > 0 && (
        <div className="space-y-3 rounded-xl border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Add a description for each photo</p>
          {pending.map((p, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="relative shrink-0">
                <img src={p.previewUrl} alt="" className="h-16 w-16 rounded-md object-cover" />
                <button
                  onClick={() => removePending(i)}
                  className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-0.5 hover:bg-secondary"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <Input
                placeholder="Description (e.g. Logo Design — $150)"
                value={p.caption}
                onChange={e => updateCaption(i, e.target.value)}
                className="flex-1 text-sm"
              />
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={uploadPending} disabled={uploading} className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              {uploading ? 'Uploading...' : `Upload ${pending.length > 1 ? `${pending.length} photos` : 'photo'}`}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPending([])} disabled={uploading}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
        <ImagePlus className="h-4 w-4 mr-2" />
        Add Photos
      </Button>
    </div>
  );
}
