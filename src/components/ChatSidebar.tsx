import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar?: string;
}

export function ChatSidebar({
  open,
  onOpenChange,
  freelancerName,
  freelancerAvatar,
}: ChatSidebarProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !user) return;
    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), text, senderId: user.id, timestamp: new Date() },
    ]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const avatarSrc = freelancerAvatar
    ?? `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(freelancerName)}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[380px] p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={avatarSrc}
              alt={freelancerName}
              className="h-9 w-9 rounded-full object-cover bg-secondary shrink-0"
            />
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-sm font-semibold text-foreground leading-tight truncate text-left">
                {freelancerName}
              </SheetTitle>
              <p className="text-xs text-muted-foreground">Message</p>
            </div>
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Say hello to {freelancerName}!
            </p>
          )}
          {messages.map(msg => {
            const isMine = msg.senderId === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isMine && (
                  <img
                    src={avatarSrc}
                    alt={freelancerName}
                    className="h-6 w-6 rounded-full object-cover shrink-0"
                  />
                )}
                {isMine && profile?.avatar_url && (
                  <img
                    src={profile.avatar_url}
                    alt="You"
                    className="h-6 w-6 rounded-full object-cover shrink-0"
                  />
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-secondary text-foreground rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border shrink-0 flex items-center gap-2">
          <Input
            placeholder={`Message ${freelancerName}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-sm"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim()}
            className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
