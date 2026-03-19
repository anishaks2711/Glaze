import { useState, useRef, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const MAX_SECONDS = 60;
const fmt = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

interface GlazeVideoStepProps {
  onVideoSelected: (file: File, previewUrl: string) => void;
  onClose: () => void;
}

export function GlazeVideoStep({ onVideoSelected, onClose }: GlazeVideoStepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);

  useEffect(() => {
    startCamera('user');
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  const startCamera = async (facing: 'user' | 'environment') => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } },
        audio: true,
      });
      streamRef.current = s;
      setStream(s);
      setFacingMode(facing);
      setPermissionDenied(false);
    } catch {
      setPermissionDenied(true);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setRecordedBlob(null);
    setPreviewUrl(null);
    const opts: MediaRecorderOptions = { videoBitsPerSecond: 2500000 };
    if (MediaRecorder.isTypeSupported('video/webm')) opts.mimeType = 'video/webm';
    const mr = new MediaRecorder(streamRef.current, opts);
    mediaRecorderRef.current = mr;
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'video/webm' });
      setRecordedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setIsRecording(false);
      setElapsed(0);
      streamRef.current?.getTracks().forEach(t => t.stop());
      setStream(null);
    };
    mr.start(100);
    setIsRecording(true);
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= MAX_SECONDS) { mr.stop(); if (timerRef.current) clearInterval(timerRef.current); }
        return next;
      });
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleUseThis = () => {
    if (!recordedBlob || !previewUrl) return;
    const file = new File([recordedBlob], 'recording.webm', { type: recordedBlob.type || 'video/webm' });
    onVideoSelected(file, previewUrl);
  };

  const handleRerecord = () => {
    setRecordedBlob(null);
    setPreviewUrl(null);
    startCamera(facingMode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {!previewUrl && (
        <button onClick={() => setShowDiscard(true)}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/50 text-white">
          <X className="h-5 w-5" />
        </button>
      )}
      {!previewUrl && !isRecording && (
        <button onClick={() => startCamera(facingMode === 'user' ? 'environment' : 'user')}
          disabled={!stream}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white disabled:opacity-30">
          <RotateCcw className="h-5 w-5" />
        </button>
      )}
      {isRecording && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-mono">
            {fmt(elapsed)} / {fmt(MAX_SECONDS)}
          </span>
        </div>
      )}

      {previewUrl ? (
        <video src={previewUrl} autoPlay loop playsInline className="flex-1 w-full object-cover" />
      ) : (
        <video ref={videoRef} autoPlay muted playsInline className="flex-1 w-full object-cover bg-neutral-900" />
      )}

      <div className="shrink-0 pb-8 pt-4 px-6 flex flex-col items-center gap-4 bg-gradient-to-t from-black/70 to-transparent">
        {permissionDenied ? (
          <div className="text-center space-y-3 px-4">
            <p className="text-white text-sm">
              Camera access is required to record a Glaze. Please allow camera access in your browser settings and try again.
            </p>
            <Button
              variant="outline"
              onClick={() => startCamera(facingMode)}
              className="border-white/40 text-white bg-black/50 hover:bg-black/70"
            >
              Try Again
            </Button>
          </div>
        ) : previewUrl ? (
          <div className="flex gap-3 w-full max-w-xs">
            <Button variant="outline" onClick={handleRerecord}
              className="flex-1 border-white/40 text-white bg-black/50 hover:bg-black/70">
              Re-record
            </Button>
            <Button onClick={handleUseThis} className="flex-1 bg-primary">Use this</Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {isRecording ? (
              <button onClick={stopRecording}
                className="h-16 w-16 rounded-full border-4 border-white flex items-center justify-center">
                <div className="h-6 w-6 rounded-sm bg-red-500" />
              </button>
            ) : (
              <button onClick={startRecording} disabled={!stream}
                className="h-16 w-16 rounded-full bg-red-500 border-4 border-white disabled:opacity-40" />
            )}
          </div>
        )}
      </div>

      <AlertDialog open={showDiscard} onOpenChange={setShowDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Discard this Glaze?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep recording</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
