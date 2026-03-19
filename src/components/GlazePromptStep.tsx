import { Button } from '@/components/ui/button';

interface GlazePromptStepProps {
  freelancerName: string;
  reviewPrompt?: string | null;
  onStart: () => void;
}

export function GlazePromptStep({ freelancerName, reviewPrompt, onStart }: GlazePromptStepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-center gap-8 px-4">
      <div className="max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          {reviewPrompt
            ? `${freelancerName} would love you to mention:`
            : 'Tips for a great Glaze'}
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          {reviewPrompt
            ? reviewPrompt
            : `Mention what service you used, what you loved most, and whether you'd recommend ${freelancerName} to others`}
        </p>
        {reviewPrompt && (
          <p className="text-xs text-muted-foreground italic">
            These are just suggestions — share whatever feels right
          </p>
        )}
      </div>
      <Button
        size="lg"
        className="w-full max-w-xs bg-primary text-primary-foreground text-base py-6"
        onClick={onStart}
      >
        Start Recording
      </Button>
    </div>
  );
}
