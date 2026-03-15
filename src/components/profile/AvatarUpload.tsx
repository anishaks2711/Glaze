import { useRef } from 'react';
import { Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  previewUrl: string | null;
  onChange: (file: File, previewUrl: string) => void;
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

export default function AvatarUpload({ previewUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast({ title: 'File too large', description: 'Profile photo must be under 5MB.', variant: 'destructive' });
      return;
    }
    onChange(file, URL.createObjectURL(file));
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative h-24 w-24 rounded-full bg-secondary overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Avatar preview" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
          <Camera className="h-6 w-6 text-white" />
        </div>
      </button>
      <p className="text-xs text-muted-foreground">Click to upload a photo (max 5MB)</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
