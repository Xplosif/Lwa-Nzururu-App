import { useState, useRef, useEffect } from "react";
import {
  useListMessages, getListMessagesQueryKey, useSendMessage,
  useListStudents, getListStudentsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle } from "lucide-react";

const CURRENT_YEAR = "2024-2025";

interface ParentContact {
  userId: number;
  fullName: string;
  studentName: string;
}

function Conversation({ withUser, onBack }: { withUser: ParentContact; onBack: () => void }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, refetch } = useListMessages(
    { withUserId: withUser.userId },
    { query: { queryKey: getListMessagesQueryKey({ withUserId: withUser.userId }), refetchInterval: 5000 } }
  );

  const sendMutation = useSendMessage({
    mutation: { onSuccess: () => { setMessage(""); refetch(); } },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b">
        <Button size="sm" variant="ghost" onClick={onBack}>&larr; Retour</Button>
        <div>
          <p className="font-medium">{withUser.fullName}</p>
          <p className="text-xs text-muted-foreground">Parent de : {withUser.studentName}</p>
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
        onSubmit={(e) => { e.preventDefault(); if (message.trim()) sendMutation.mutate({ data: { toUserId: withUser.userId, content: message } }); }}
        className="flex gap-2 p-4 border-t"
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
  const [selected, setSelected] = useState<ParentContact | null>(null);

  const classStudentParams = { classId: user?.classId || 0, academicYear: CURRENT_YEAR };
  const { data: students } = useListStudents(classStudentParams, {
    query: { enabled: !!user?.classId, queryKey: getListStudentsQueryKey(classStudentParams) },
  });

  const parentContacts: ParentContact[] = (students || [])
    .filter((s) => s.parentUserId)
    .map((s) => ({
      userId: s.parentUserId!,
      fullName: s.parentFullName || `Parent de ${s.firstName}`,
      studentName: `${s.firstName} ${s.lastName}`,
    }));

  if (selected) {
    return (
      <div className="h-full flex flex-col">
        <Conversation withUser={selected} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground text-sm">
          {user?.role === "titulaire" ? `Parents de votre classe : ${user?.className}` : "Vos conversations"}
        </p>
      </div>

      {user?.role === "titulaire" && parentContacts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              Aucun parent n'est encore enregistre pour votre classe. Les comptes parents sont crees lors de l'inscription des eleves.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {parentContacts.map((contact) => (
          <Card key={contact.userId} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setSelected(contact)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                <MessageCircle size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{contact.fullName}</p>
                <p className="text-xs text-muted-foreground">Parent de : {contact.studentName}</p>
              </div>
              <Button size="sm" variant="outline">Ouvrir</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
