import { useState, useRef, useEffect } from "react";
import {
  useGetParentBulletin, getGetParentBulletinQueryKey,
  useListMessages, getListMessagesQueryKey, useSendMessage,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Phone, Send, Trophy } from "lucide-react";

const CURRENT_YEAR = "2024-2025";

const PERIOD_LABELS: Record<string, string> = {
  P1: "P1", P2: "P2", exam_s1: "Exam S1", P3: "P3", P4: "P4", exam_s2: "Exam S2",
};

function ordinalFr(n: number): string {
  if (n === 1) return "1er";
  return `${n}e`;
}

function Chat({ titulaireUserId, titulaireFullName }: { titulaireUserId: number; titulaireFullName: string }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, refetch } = useListMessages(
    { withUserId: titulaireUserId },
    { query: { queryKey: getListMessagesQueryKey({ withUserId: titulaireUserId }), refetchInterval: 5000 } }
  );

  const sendMutation = useSendMessage({
    mutation: {
      onSuccess: () => { setMessage(""); refetch(); },
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/20 rounded-md">
        {(!messages || messages.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucun message. Commencez la conversation avec {titulaireFullName}.
          </p>
        )}
        {(messages || []).map((msg) => {
          const isMine = msg.fromUserId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isMine ? "bg-primary text-primary-foreground" : "bg-background border"}`}>
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
        onSubmit={(e) => {
          e.preventDefault();
          if (message.trim()) sendMutation.mutate({ data: { toUserId: titulaireUserId, content: message } });
        }}
        className="flex gap-2 mt-2"
      >
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ecrire un message..."
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={!message.trim() || sendMutation.isPending}>
          <Send size={15} />
        </Button>
      </form>
    </div>
  );
}

export default function ParentBulletin() {
  const [semester, setSemester] = useState<"S1" | "S2">("S1");
  const [chatOpen, setChatOpen] = useState(false);
  const [proviseurChat, setProviseurChat] = useState(false);
  const [proviseur, setProviseur] = useState<{ id: number; fullName: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/proviseur", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setProviseur(d); })
      .catch(() => {});
  }, []);

  const semesterPeriods = semester === "S1" ? ["P1", "P2", "exam_s1"] : ["P3", "P4", "exam_s2"];

  const bulletinParams = { academicYear: CURRENT_YEAR, semester };
  const { data, isLoading, error, refetch } = useGetParentBulletin(bulletinParams, {
    query: { enabled: true, queryKey: getGetParentBulletinQueryKey(bulletinParams) },
  });

  const errorMsg = (error as any)?.response?.data?.error || (error as any)?.message;

  const rankDisplay = data?.rank != null
    ? `${ordinalFr(data.rank)} / ${data.totalStudentsInClass} eleve(s)`
    : null;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Bulletin de mon enfant</h1>
          <p className="text-muted-foreground text-sm">Institut Lwa-Nzururu — {CURRENT_YEAR}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data?.titulaireUserId && (
            <Dialog open={chatOpen} onOpenChange={setChatOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <MessageCircle size={15} /> Titulaire
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Chat avec {data.titulaireFullName || "le titulaire"}</DialogTitle>
                </DialogHeader>
                <Chat titulaireUserId={data.titulaireUserId} titulaireFullName={data.titulaireFullName || "Le titulaire"} />
              </DialogContent>
            </Dialog>
          )}
          {proviseur && (
            <Dialog open={proviseurChat} onOpenChange={setProviseurChat}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <MessageCircle size={15} /> Proviseur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Chat avec {proviseur.fullName} (Proviseur)</DialogTitle>
                </DialogHeader>
                <Chat titulaireUserId={proviseur.id} titulaireFullName={proviseur.fullName} />
              </DialogContent>
            </Dialog>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Phone size={15} /> Contacter le bureau
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Bureau d'etudes</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">Pour toute question administrative, contactez le bureau d'etudes de l'Institut Lwa-Nzururu :</p>
                <div className="space-y-2 bg-muted/40 rounded-md p-3">
                  <p><strong>Institut Lwa-Nzururu</strong></p>
                  <p>Beni, Nord-Kivu, RDC</p>
                  <p>Bureau du Proviseur — disponible du lundi au vendredi</p>
                </div>
                <p className="text-xs text-muted-foreground">Vous pouvez aussi envoyer un message direct au titulaire de la classe via le bouton "Chat avec le titulaire".</p>
              </div>
            </DialogContent>
          </Dialog>
          {data && (
            <Button size="sm" variant="outline" onClick={() => window.print()} className="print:hidden">
              Imprimer
            </Button>
          )}
        </div>
      </div>

      {/* Rank Banner */}
      {rankDisplay && (
        <Card className="border-primary/30 bg-primary/5 print:hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-full bg-primary">
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rang dans la classe ({data?.className})</p>
              <p className="text-2xl font-bold">{rankDisplay}</p>
            </div>
            <div className="ml-auto">
              <Badge variant={data?.passed ? "default" : "destructive"} className="text-sm px-3 py-1">
                {data?.passed ? "ADMIS(E)" : "ECHOUE(E)"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Semester selector */}
      <div className="flex gap-3 items-center print:hidden">
        <label className="text-sm font-medium">Semestre :</label>
        <Select value={semester} onValueChange={(v) => setSemester(v as "S1" | "S2")}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="S1">1er semestre</SelectItem>
            <SelectItem value="S2">2e semestre</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Actualiser</Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Chargement...</p>}

      {!isLoading && error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-amber-800 font-medium">Resultats non disponibles</p>
            <p className="text-amber-700 text-sm mt-1">
              {errorMsg || "Les resultats de ce semestre ne sont pas encore disponibles. Veuillez patienter que le Proviseur approuve la deliberation."}
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <Card className="print:shadow-none print:border-0">
          <CardHeader className="pb-3">
            <div className="text-center space-y-1">
              <p className="font-bold text-lg">Institut Lwa-Nzururu</p>
              <p className="text-sm text-muted-foreground">Beni, Nord-Kivu, RDC</p>
              <p className="font-semibold mt-2">BULLETIN DE RESULTATS — {data.semester === "S1" ? "1ER SEMESTRE" : "2E SEMESTRE"}</p>
              <p className="text-sm">Annee scolaire : {data.academicYear}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm border rounded p-3 bg-muted/30">
              <div><span className="font-medium">Eleve :</span> {data.fullName}</div>
              <div><span className="font-medium">Classe :</span> {data.className}</div>
              <div><span className="font-medium">N° matricule :</span> {data.registrationNumber}</div>
              <div><span className="font-medium">Annee :</span> {data.academicYear}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium">Cours</th>
                    <th className="text-center p-2 font-medium">Coef.</th>
                    {semesterPeriods.map((p) => (
                      <th key={p} className="text-center p-2 font-medium">{PERIOD_LABELS[p]}</th>
                    ))}
                    <th className="text-right p-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.gradesBySubject || []).map((row: any) => {
                    const semTotal = row.semesterTotal;
                    const maxForPeriods = row.maxPoints * semesterPeriods.length;
                    return (
                      <tr key={row.subjectId} className="border-b hover:bg-muted/20">
                        <td className="p-2">{row.subjectName}</td>
                        <td className="p-2 text-center text-muted-foreground">{row.coefficient}</td>
                        {semesterPeriods.map((p) => (
                          <td key={p} className="p-2 text-center font-mono">
                            {row[p] !== null && row[p] !== undefined ? Number(row[p]).toFixed(1) : <span className="text-muted-foreground">—</span>}
                          </td>
                        ))}
                        <td className="p-2 text-right font-mono">
                          {semTotal !== null ? `${Number(semTotal).toFixed(1)} / ${maxForPeriods}` : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="border rounded p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Total obtenu :</span>
                  <span className="font-mono">{data.totalPoints.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total maximum :</span>
                  <span className="font-mono">{data.maxTotalPoints.toFixed(0)}</span>
                </div>
                {data.bonusPoints > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span className="font-medium">Points de deliberation :</span>
                    <span className="font-mono">+{data.bonusPoints}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Pourcentage :</span>
                  <span className="font-mono">{data.percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="border rounded p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Rang :</span>
                  <span className="font-mono font-bold">
                    {data.rank != null ? `${ordinalFr(data.rank)} / ${data.totalStudentsInClass}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium">Resultat :</span>
                  <Badge variant={data.passed ? "default" : "destructive"} className="text-base px-4 py-1">
                    {data.passed ? "ADMIS(E)" : "ECHOUE(E)"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
