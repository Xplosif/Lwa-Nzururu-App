import { useState } from "react";
import { useListUsers, getListUsersQueryKey, useCreateUser, useDeleteUser, useUpdateUser } from "@workspace/api-client-react";
import { useListClasses } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ROLE_LABELS: Record<string, string> = {
  proviseur: "Proviseur",
  enseignant: "Enseignant",
  titulaire: "Titulaire",
  secretaire: "Secretaire",
};
const ROLE_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  proviseur: "default",
  titulaire: "secondary",
  enseignant: "outline",
  secretaire: "secondary",
};

export default function Teachers() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useListUsers();
  const { data: classes } = useListClasses();
  const [open, setOpen] = useState(false);
  const [newCreds, setNewCreds] = useState<{ username: string; password: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({ fullName: "", role: "enseignant", classId: "" });

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setNewCreds({ username: data.tempUsername, password: data.tempPassword, name: data.user.fullName });
        setForm({ fullName: "", role: "enseignant", classId: "" });
      },
    },
  });

  const deleteMutation = useDeleteUser({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }) },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        fullName: form.fullName,
        role: form.role as any,
        classId: form.classId ? parseInt(form.classId) : undefined,
      },
    });
  };

  const copyToClipboard = () => {
    if (!newCreds) return;
    navigator.clipboard.writeText(`Identifiant: ${newCreds.username}\nMot de passe: ${newCreds.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const staff = (users || []).filter((u) => u.role !== "proviseur");

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Personnel</h1>
          <p className="text-muted-foreground text-sm">{staff.length} membres du personnel</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 w-full sm:w-auto">
              <Plus size={16} /> Ajouter un membre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Creer un compte</DialogTitle>
            </DialogHeader>
            {newCreds ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-green-800">Compte cree pour {newCreds.name}</p>
                  <p className="text-sm text-green-700">Remettez ces identifiants a la personne:</p>
                  <div className="bg-white rounded p-3 font-mono text-sm space-y-1">
                    <div>Identifiant: <strong>{newCreds.username}</strong></div>
                    <div>Mot de passe: <strong>{newCreds.password}</strong></div>
                  </div>
                </div>
                <Button variant="outline" onClick={copyToClipboard} className="w-full gap-2">
                  {copied ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} />}
                  {copied ? "Copie!" : "Copier les identifiants"}
                </Button>
                <Button onClick={() => { setNewCreds(null); setOpen(false); }} className="w-full">Terminer</Button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <Label>Nom complet *</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Role *</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enseignant">Enseignant</SelectItem>
                      <SelectItem value="titulaire">Titulaire de classe</SelectItem>
                      <SelectItem value="secretaire">Secretaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(form.role === "titulaire") && (
                  <div className="space-y-1">
                    <Label>Classe assignee</Label>
                    <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                      <SelectTrigger><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
                      <SelectContent>
                        {(classes || []).map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creation..." : "Creer le compte"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="hidden md:grid px-5 py-2 grid-cols-12 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="col-span-4">Nom</span>
              <span className="col-span-2">Role</span>
              <span className="col-span-3">Classe assignee</span>
              <span className="col-span-2 text-center">Statut</span>
              <span className="col-span-1 text-right">Actions</span>
            </div>
            {isLoading && <div className="px-5 py-8 text-center text-muted-foreground text-sm">Chargement...</div>}
            {!isLoading && staff.length === 0 && (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">Aucun membre du personnel</div>
            )}
            {staff.map((u) => (
              <div key={u.id} className="px-4 sm:px-5 py-3 flex flex-col gap-2 md:grid md:grid-cols-12 md:gap-0 text-sm md:items-center hover:bg-muted/20">
                <div className="flex items-center justify-between md:contents">
                  <span className="md:col-span-4 font-medium">{u.fullName}</span>
                  <Badge variant={ROLE_COLORS[u.role] || "outline"} className="text-xs md:col-span-2 w-fit">{ROLE_LABELS[u.role] || u.role}</Badge>
                </div>
                <div className="flex items-center justify-between md:contents">
                  <span className="md:col-span-3 text-muted-foreground text-xs md:text-sm">{u.className || "Aucune classe"}</span>
                  <div className="md:col-span-2 md:text-center">
                    {u.isFirstLogin ? (
                      <Badge variant="secondary" className="text-xs">En attente</Badge>
                    ) : (
                      <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">Actif</Badge>
                    )}
                  </div>
                </div>
                <div className="md:col-span-1 flex justify-end pt-1 md:pt-0 border-t md:border-t-0 border-border/60">
                  <button
                    className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                    onClick={() => { if (confirm("Supprimer ce compte?")) deleteMutation.mutate({ id: u.id }); }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
