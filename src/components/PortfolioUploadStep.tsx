import { useState, useRef } from 'react';
import { X, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validatePortfolioFile } from '@/lib/validation';
import { usePortfolio } from '@/hooks/usePortfolio';

interface PhotoItem {
  file: File;
  preview: string;
  caption: string;
}

interface Props {
  freelancerId: string;
  onSkip: () => void;
  onDone: () => void;
}

export default function PortfolioUploadStep({ freelancerId, onSkip, onDone }: Props) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addPhoto } = usePortfolio(freelancerId);

  function handleFiles(files: FileList) {
    setError(null);
    const valid: PhotoItem[] = [];
    Array.from(files).slice(0, 10 - photos.length).forEach(file => {
      const v = validatePortfolioFile(file);
      if (!v.valid) { setError(v.error ?? 'Invalid file'); return; }
      valid.push({ file, preview: URL.createObjectURL(file), caption: '' });
    });
    setPhotos(prev => [...prev, ...valid].slice(0, 10));
  }

  function removePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  }

  function updateCaption(idx: number, caption: string) {
    setPhotos(prev => prev.map((p, i) => i === idx ? { ...p, caption } : p));
  }

  async function handleUpload() {
    if (photos.length === 0) { onDone(); return; }
    setUploading(true);
    setError(null);
    for (let i = 0; i < photos.length; i++) {
      const err = await addPhoto(photos[i].file, photos[i].caption || null, i);
      if (err) { setError('Upload failed. Please try again.'); setUploading(false); return; }
    }
    setUploading(false);
    onDone();
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />
      {photos.length < 10 && (
        <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <ImagePlus className="h-4 w-4 mr-2" /> Select Photos ({photos.length}/10)
        </Button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((p, idx) => (
            <div key={idx} className="space-y-1">
              <div className="relative aspect-square rounded-md overflow-hidden bg-secondary">
                <img src={p.preview} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5 hover:bg-destructive/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <Input
                placeholder="Add caption..."
                value={p.caption}
                onChange={e => updateCaption(idx, e.target.value)}
                maxLength={200}
                className="text-xs h-7"
                disabled={uploading}
              />
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onSkip} disabled={uploading}>
          Skip
        </Button>
        <Button className="flex-1" onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : photos.length > 0 ? 'Upload & Continue' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
