import { useState, useRef } from 'react';
import { Trash2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePortfolio } from '@/hooks/usePortfolio';
import { validatePortfolioFile } from '@/lib/validation';

interface Props {
  freelancerId: string | undefined;
}

export default function PortfolioManager({ freelancerId }: Props) {
  const { portfolio, loading, addPhoto, deletePhoto } = usePortfolio(freelancerId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList) {
    setError(null);
    for (const file of Array.from(files)) {
      const v = validatePortfolioFile(file);
      if (!v.valid) { setError(v.error ?? 'Invalid file'); return; }
    }
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const err = await addPhoto(files[i], null, portfolio.length + i);
      if (err) { setError('Upload failed. Please try again.'); break; }
    }
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
      {portfolio.length === 0 ? (
        <p className="text-sm text-muted-foreground">No portfolio photos yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {portfolio.map(item => (
            <div key={item.id} className="relative aspect-square rounded-md overflow-hidden group">
              <img src={item.image_url} alt={item.caption ?? ''} className="h-full w-full object-cover" />
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
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
        <ImagePlus className="h-4 w-4 mr-2" />
        {uploading ? 'Uploading...' : 'Add Photos'}
      </Button>
    </div>
  );
}
