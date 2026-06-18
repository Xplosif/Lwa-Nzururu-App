import { useState, useRef, useEffect } from "react";
import { useListMessages, getListMessagesQueryKey, useSendMessage } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, ArrowLeft } from "lucide-react";

interface Conversation {
  userId: number;
  fullName: string;
  role: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

function ConversationView({ partner, onBack }: { partner: Conversation; onBack: () => void }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, refetch } = useListMessages(
    { withUserId: partner.userId },
    { query: { queryKey: getListMessagesQueryKey({ withUserId: partner.userId }), refetchInterval: 5000 } }
  );

  const sendMutation = useSendMessage({
    mutation: { onSuccess: () => { setMessage(""); refetch(); } },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b flex-shrink-0">
        <Button size="sm" variant="ghost" className="gap-1" onClick={onBack}>
          <ArrowLeft size={16} /> Retour
        </Button>
        <div>
          <p className="font-medium">{partner.fullName}</p>
          <p className="text-xs text-muted-foreground capitalize">{partner.role === "parent" ? "Parent d'eleve" : partner.role}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/10">
        {(!messages || messages.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">Aucun message echange.</p>
        )}
        {(messages || []).map((msg) => {
          const isMine = msg.fromUserId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isMine ? "bg-primary text-primary-foreground" : "bg-background border"}`}>
                {!isMine && <p className="text-xs font-semibold mb-1 opacity-70">{msg.fromFullName}</p>}
                <p>{msg.content}</p>
                <p className="text-xs opacity-50 mt-1">{new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); if (message.trim()) sendMutation.mutate({ data: { toUserId: partner.userId, content: message } }); }}
        className="flex gap-2 p-4 border-t flex-shrink-0"
      >
        <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ecrire un message..." className="flex-1" />
        <Button type="submit" disabled={!message.trim() || sendMutation.isPending}>
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages/conversations", { credentials: "include" });
      if (res.ok) setConversations(await res.json());
    } catch { /* ignore */ }
    finally { setLoadingConvs(false); }
  };

  useEffect(() => {
    fetchConversations();
    const id = setInterval(fetchConversations, 10000);
    return () => clearInterval(id);
  }, []);

  if (selected) {
    return (
      <div className="h-full flex flex-col">
        <ConversationView partner={selected} onBack={() => { setSelected(null); fetchConversations(); }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground text-sm">
          {user?.role === "titulaire" ? `Conversations avec les parents de votre classe` : "Vos conversations"}
        </p>
      </div>

      {loadingConvs && <p className="text-muted-foreground text-sm">Chargement...</p>}

      {!loadingConvs && conversations.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              Aucune conversation pour l'instant. Les parents peuvent vous envoyer un message depuis leur bulletin.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {conversations.map((conv) => (
          <Card
            key={conv.userId}
            className="cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => setSelected(conv)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted flex-shrink-0">
                <MessageCircle size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{conv.fullName}</p>
                  {conv.unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0">{conv.unreadCount}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              <p className="text-xs text-muted-foreground flex-shrink-0">
                {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : ""}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
