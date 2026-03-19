import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { ChatSidebar } from './ChatSidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface Conversation {
  otherId: string;
  otherName: string;
  otherAvatar: string | null;
  lastMessage: string;
}

export function FloatingChat() {
  const { user } = useAuth();
  const [listOpen, setListOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState('');
  const [activeChatAvatar, setActiveChatAvatar] = useState<string | undefined>();

  useEffect(() => {
    if (!user?.id || !listOpen) return;

    async function loadConversations() {
      const { data: msgs } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, text, created_at')
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });

      if (!msgs || msgs.length === 0) {
        setConversations([]);
        return;
      }

      const seenIds = new Set<string>();
      const otherIds: string[] = [];
      const latestByOther = new Map<string, typeof msgs[0]>();

      for (const msg of msgs) {
        const otherId = msg.sender_id === user!.id ? msg.receiver_id : msg.sender_id;
        if (!seenIds.has(otherId)) {
          seenIds.add(otherId);
          otherIds.push(otherId);
          latestByOther.set(otherId, msg);
        }
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', otherIds);

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

      setConversations(otherIds.map(otherId => {
        const p = profileMap.get(otherId);
        const msg = latestByOther.get(otherId)!;
        return {
          otherId,
          otherName: p?.full_name ?? 'Unknown',
          otherAvatar: p?.avatar_url ?? null,
          lastMessage: msg.text,
        };
      }));
    }

    loadConversations();
  }, [user?.id, listOpen]);

  if (!user) return null;

  const openChat = (conv: Conversation) => {
    setActiveChatId(conv.otherId);
    setActiveChatName(conv.otherName);
    setActiveChatAvatar(conv.otherAvatar ?? undefined);
    setListOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setListOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary shadow-elevated flex items-center justify-center text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
        aria-label="Messages"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <Sheet open={listOpen} onOpenChange={setListOpen}>
        <SheetContent side="right" className="w-full sm:w-[380px] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
            <SheetTitle>Messages</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No conversations yet.</p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.otherId}
                  onClick={() => openChat(conv)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors border-b border-border text-left"
                >
                  <img
                    src={conv.otherAvatar ?? `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(conv.otherName)}`}
                    alt={conv.otherName}
                    className="h-10 w-10 rounded-full object-cover bg-secondary shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{conv.otherName}</p>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {activeChatId && (
        <ChatSidebar
          open={!!activeChatId}
          onOpenChange={v => { if (!v) setActiveChatId(null); }}
          freelancerId={activeChatId}
          freelancerName={activeChatName}
          freelancerAvatar={activeChatAvatar}
        />
      )}
    </>
  );
}
