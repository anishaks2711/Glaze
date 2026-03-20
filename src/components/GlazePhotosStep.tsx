import { useState, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GlazePhotosStepProps {
  isEditMode: boolean;
  submitting: boolean;
  uploadingLong: boolean;
  statusLabel?: string;
  existingPhotoUrls?: string[];
  onSubmit: (photos: File[], removedExisting: boolean) => void;
}

export function GlazePhotosStep({
  isEditMode,
  submitting,
  uploadingLong,
  statusLabel,
  existingPhotoUrls = [],
  onSubmit,
}: GlazePhotosStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingRemoved, setExistingRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (photos.length + files.length > 5) { setError('Max 5 photos'); return; }
    const newPhotos: File[] = [];
    const newPreviews: string[] = [];
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) { setError('Each photo must be under 10MB'); return; }
      if (!f.type.startsWith('image/')) { setError('Images only'); return; }
      newPhotos.push(f);
      newPreviews.push(URL.createObjectURL(f));
    }
    setPhotos(p => [...p, ...newPhotos]);
    setPreviews(p => [...p, ...newPreviews]);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (idx: number) => {
    setPhotos(p => p.filter((_, i) => i !== idx));
    setPreviews(p => p.filter((_, i) => i !== idx));
  };

  const loadingLabel = statusLabel ?? (uploadingLong ? 'Still uploading...' : 'Uploading...');
  const submitLabel = isEditMode ? 'Update Glaze' : 'Submit Glaze';
  const showExisting = existingPhotoUrls.length > 0 && !existingRemoved;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Add photos from the event</h2>
        <p className="text-sm text-muted-foreground mt-1">Optional — up to 5 photos, 10MB each</p>
      </div>

      {/* Existing photos (edit mode) */}
      {showExisting && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-muted-foreground">
              Current {existingPhotoUrls.length === 1 ? 'photo' : `photos (${existingPhotoUrls.length})`}
            </p>
            <button
              onClick={() => setExistingRemoved(true)}
              className="text-xs text-destructive hover:underline"
            >
              Remove all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {existingPhotoUrls.map((url, idx) => (
              <div key={idx} className="relative w-20 h-20">
                <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover rounded-md" />
              </div>
            ))}
          </div>
          {photos.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5">
              New photos will replace existing ones when you submit.
            </p>
          )}
        </div>
      )}

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((url, idx) => (
            <div key={idx} className="relative w-20 h-20">
              <img src={url} alt="" className="w-full h-full object-cover rounded-md" />
              <button
                onClick={() => remove(idx)}
                className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < 5 && (
        <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-primary">
          + Add photos
          <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleAdd} className="hidden" />
        </label>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => onSubmit([], existingRemoved)}
          disabled={submitting}
          className="flex-1"
        >
          {submitting && photos.length === 0 ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{loadingLabel}</>
          ) : 'Skip'}
        </Button>
        <Button
          onClick={() => onSubmit(photos, existingRemoved)}
          disabled={submitting}
          className="flex-1"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{loadingLabel}</>
          ) : submitLabel}
        </Button>
      </div>
    </div>
  );
}
