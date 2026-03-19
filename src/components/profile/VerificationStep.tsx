import { useRef, useState } from 'react';
import { CheckCircle2, Shield } from 'lucide-react';
import { IconInstagram, IconLinkedIn } from './SocialIcons';

interface Props {
  verifiedInstagram: boolean;
  verifiedLinkedin: boolean;
  verifiedIdentity: boolean;
  onVerifiedInstagramChange: (v: boolean) => void;
  onVerifiedLinkedinChange: (v: boolean) => void;
  onVerifiedIdentityChange: (v: boolean) => void;
}

export default function VerificationStep({
  verifiedInstagram, verifiedLinkedin, verifiedIdentity,
  onVerifiedInstagramChange, onVerifiedLinkedinChange, onVerifiedIdentityChange,
}: Props) {
  const [recording, setRecording] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  async function handleIdentityClick() {
    if (verifiedIdentity) { onVerifiedIdentityChange(false); return; }
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setRecording(true);
      setTimeout(() => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setRecording(false);
        onVerifiedIdentityChange(true);
      }, 5000);
    } catch {
      // Camera denied — mark verified anyway for prototype
      onVerifiedIdentityChange(true);
    }
  }

  const cardClass = (active: boolean) =>
    `flex items-center gap-3 rounded-lg border p-3 text-left w-full transition-colors cursor-pointer ${
      active
        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
        : 'border-border hover:border-primary/50'
    }`;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold">Verify your identity</p>
        <p className="text-xs text-muted-foreground">Increases client trust — at least one required</p>
      </div>
      <div className="grid gap-2">
        <button type="button" onClick={() => onVerifiedInstagramChange(!verifiedInstagram)} className={cardClass(verifiedInstagram)}>
          <IconInstagram className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-sm font-medium">Verify with Instagram</span>
          {verifiedInstagram && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Verified
            </span>
          )}
        </button>

        <button type="button" onClick={() => onVerifiedLinkedinChange(!verifiedLinkedin)} className={cardClass(verifiedLinkedin)}>
          <IconLinkedIn className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-sm font-medium">Verify with LinkedIn</span>
          {verifiedLinkedin && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Verified
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleIdentityClick}
          disabled={recording}
          className={cardClass(verifiedIdentity)}
        >
          <Shield className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-sm font-medium">
            {recording ? 'Recording… (5 s)' : 'Record identity video'}
          </span>
          {verifiedIdentity && !recording && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Verified
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
