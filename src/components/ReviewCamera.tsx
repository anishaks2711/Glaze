import { useState, useRef, useEffect } from 'react';
import { Video, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAX_SECONDS = 60;
const hasMediaRecorder = typeof MediaRecorder !== 'undefined';

interface ReviewCameraProps {
  onCapture: (blob: Blob, previewUrl: string) => void;
}

export function ReviewCamera({ onCapture }: ReviewCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stream]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  if (!hasMediaRecorder) return null;

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
    } catch {
      setPermissionDenied(true);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const recorderOptions: MediaRecorderOptions = { videoBitsPerSecond: 2500000 };
    if (MediaRecorder.isTypeSupported('video/webm')) recorderOptions.mimeType = 'video/webm';
    const mr = new MediaRecorder(stream, recorderOptions);
    mediaRecorderRef.current = mr;
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      onCapture(blob, URL.createObjectURL(blob));
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
      setIsRecording(false);
      setElapsed(0);
    };
    mr.start();
    setIsRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        if (next >= MAX_SECONDS) {
          mr.stop();
          if (timerRef.current) clearInterval(timerRef.current);
        }
        return next;
      });
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  if (permissionDenied) {
    return (
      <p className="text-xs text-muted-foreground col-span-2 py-1">
        Camera access needed to record. You can upload a video from your camera roll instead.
      </p>
    );
  }

  if (stream) {
    return (
      <div className="col-span-2 space-y-2">
        <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-lg bg-black aspect-video" />
        <div className="flex items-center gap-2">
          {isRecording ? (
            <>
              <span className="text-xs font-mono text-destructive tabular-nums">
                {MAX_SECONDS - elapsed}s
              </span>
              <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
                <Square className="h-3.5 w-3.5 mr-1" /> Stop
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" onClick={startRecording}>
              <Video className="h-3.5 w-3.5 mr-1" /> Start Recording
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" className="flex-1" onClick={startCamera}>
      <Video className="h-4 w-4 mr-1.5" /> Record
    </Button>
  );
}
