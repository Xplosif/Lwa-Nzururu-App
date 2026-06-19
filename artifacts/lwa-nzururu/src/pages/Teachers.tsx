import { useState, useMemo } from "react";
import {
  useListUsers, getListUsersQueryKey, useCreateUser, useDeleteUser,
  useListClasses, useListSubjects, useListCourseAssignments,
  getListCourseAssignmentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Copy, CheckCircle, BookOpen, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const CURRENT_YEAR = "2024-2025";

const ROLE_LABELS: Record<string, string> = {
  proviseur: "Proviseur",
  enseignant: "Enseignant",
  titulaire: "Titulaire",
  secretaire: "Secretaire",
  parent: "Parent d'eleve",
};
const ROLE_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  proviseur: "default",
  titulaire: "secondary",
  enseignant: "outline",
  secretaire: "secondary",
  parent: "outline",
};

interface Combo { key: string; subjectId: number; subjectName: string; classId: number; className: string; }

export default function Teachers() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useListUsers();
  const { data: classes } = useListClasses();
  const { data: subjects } = useListSubjects();
  const { data: assignments } = useListCourseAssignments();
  const [open, setOpen] = useState(false);
  const [newCreds, setNewCreds] = useState<{ username: string; password: string; name: string; assignedCount: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [createError, setCreateError] = useState("");

  const [form, setForm] = useState({ fullName: "", role: "enseignant", classId: "" });
  const [selectedCombos, setSelectedCombos] = useState<string[]>([]);

  const classesWithTitulaire = useMemo(() => {
    return new Set(
      (users || []).filter((u) => u.role === "titulaire" && u.classId).map((u) => u.classId!)
    );
  }, [users]);

  const availableCombos = useMemo<Combo[]>(() => {
    const assigned = new Set((assignments || []).map((a) => `${a.subjectId}-${a.classId}`));
    const result: Combo[] = [];
    for (const subject of (subjects || [])) {
      for (const cls of (classes || [])) {
        const key = `${subject.id}-${cls.id}`;
        if (!assigned.has(key)) {
          result.push({ key, subjectId: subject.id, subjectName: subject.name, classId: cls.id, className: cls.name });
        }
      }
    }
    return result;
  }, [subjects, classes, assignments]);

  const titulaireClassCombos = useMemo<Combo[]>(() => {
    if (form.role !== "titulaire" || !form.classId) return [];
    return availableCombos.filter((c) => String(c.classId) === form.classId);
  }, [availableCombos, form.role, form.classId]);

  const titulaireSubjectGroups = useMemo(() => {
    const groups: Record<string, Combo[]> = {};
    for (const c of titulaireClassCombos) {
      if (!groups[c.subjectName]) groups[c.subjectName] = [];
      groups[c.subjectName].push(c);
    }
    return groups;
  }, [titulaireClassCombos]);

  const toggleCombo = (key: string) => {
    setSelectedCombos((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: async (data) => {
        const userId = data.user.id;
        let assignedCount = 0;
        setAssignError("");
        setCreateError("");

        const needsAssignments = (form.role === "enseignant" || form.role === "titulaire") && selectedCombos.length > 0;
        if (needsAssignments) {
          const combos = availableCombos.filter((c) => selectedCombos.includes(c.key));
          const results = await Promise.allSettled(
            combos.map((c) =>
              fetch("/api/course-assignments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ teacherId: userId, subjectId: c.subjectId, classId: c.classId, academicYear: CURRENT_YEAR }),
              })
            )
          );
          assignedCount = results.filter((r) => r.status === "fulfilled" && (r.value as Response).ok).length;
          if (assignedCount < combos.length) setAssignError(`${combos.length - assignedCount} affectation(s) ont echoue.`);
          queryClient.invalidateQueries({ queryKey: getListCourseAssignmentsQueryKey() });
        }

        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setNewCreds({ username: data.tempUsername, password: data.tempPassword, name: data.user.fullName, assignedCount });
        setForm({ fullName: "", role: "enseignant", classId: "" });
        setSelectedCombos([]);
      },
      onError: async (error: any) => {
        try {
          const body = await error?.response?.json?.();
          setCreateError(body?.error || "Une erreur est survenue.");
        } catch {
          setCreateError("Une erreur est survenue.");
        }
      },
    },
  });

  const deleteMutation = useDeleteUser({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }) },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    createMutation.mutate({
      data: {
        fullName: form.fullName,
        role: form.role as "enseignant" | "titulaire" | "secretaire",
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

  const selectedClassHasTitulaire =
    form.role === "titulaire" && form.classId
      ? classesWithTitulaire.has(parseInt(form.classId))
      : false;

  const personnel = (users || []).filter((u) => !["proviseur", "parent"].includes(u.role));
  const parents = (users || []).filter((u) => u.role === "parent");

  const subjectGroups = useMemo(() => {
    const groups: Record<string, Combo[]> = {};
    for (const c of availableCombos) {
      if (!groups[c.subjectName]) groups[c.subjectName] = [];
      groups[c.subjectName].push(c);
    }
    return groups;
  }, [availableCombos]);

  const renderUserRow = (u: (typeof personnel)[0]) => {
    const teacherAssignments = (assignments || []).filter((a) => a.teacherId === u.id);
    const showAssignments = u.role === "enseignant" || u.role === "titulaire";
    return (
      <div key={u.id} className="px-4 sm:px-5 py-3 flex flex-col gap-2 md:grid md:grid-cols-12 md:gap-0 text-sm md:items-center hover:bg-muted/20">
        <div className="flex items-center justify-between md:contents">
          <span className="md:col-span-4 font-medium">{u.fullName}</span>
          <Badge variant={ROLE_COLORS[u.role] || "outline"} className="text-xs md:col-span-2 w-fit">{ROLE_LABELS[u.role] || u.role}</Badge>
        </div>
        <div className="flex items-center justify-between md:contents">
          <div className="md:col-span-3 text-muted-foreground text-xs md:text-sm">
            {showAssignments ? (
              <div className="space-y-0.5">
                {u.role === "titulaire" && u.className && (
                  <div className="text-xs font-medium text-foreground/70">Classe : {u.className}</div>
                )}
                {teacherAssignments.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {teacherAssignments.slice(0, 3).map((a) => (
                      <Badge key={a.id} variant="outline" className="text-xs">{a.subjectName} – {a.className}</Badge>
                    ))}
                    {teacherAssignments.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{teacherAssignments.length - 3}</Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground/60 italic">Aucun cours affecte</span>
                )}
              </div>
            ) : (
              u.className || "—"
            )}
          </div>
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
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Personnel</h1>
          <p className="text-muted-foreground text-sm">{personnel.length} membre(s) du personnel, {parents.length} parent(s)</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setNewCreds(null); setSelectedCombos([]); setAssignError(""); setCreateError(""); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 w-full sm:w-auto">
              <Plus size={16} /> Ajouter un membre
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Creer un compte</DialogTitle>
            </DialogHeader>

            {newCreds ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-green-800">Compte cree pour {newCreds.name}</p>
                  <p className="text-sm text-green-700">Remettez ces identifiants a la personne :</p>
                  <div className="bg-white rounded p-3 font-mono text-sm space-y-1">
                    <div>Identifiant: <strong>{newCreds.username}</strong></div>
                    <div>Mot de passe: <strong>{newCreds.password}</strong></div>
                  </div>
                  {newCreds.assignedCount > 0 && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <BookOpen size={12} /> {newCreds.assignedCount} cours assigne(s) avec succes
                    </p>
                  )}
                  {assignError && <p className="text-xs text-red-600">{assignError}</p>}
                </div>
                <Button variant="outline" onClick={copyToClipboard} className="w-full gap-2">
                  {copied ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} />}
                  {copied ? "Copie!" : "Copier les identifiants"}
                </Button>
                <Button onClick={() => { setNewCreds(null); setOpen(false); }} className="w-full">Terminer</Button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="space-y-1">
                  <Label>Nom complet *</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
                </div>

                <div className="space-y-1">
                  <Label>Role *</Label>
                  <Select value={form.role} onValueChange={(v) => { setForm({ ...form, role: v, classId: "" }); setSelectedCombos([]); setCreateError(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enseignant">Enseignant</SelectItem>
                      <SelectItem value="titulaire">Titulaire de classe</SelectItem>
                      <SelectItem value="secretaire">Secretaire</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.role === "titulaire" && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Un titulaire est aussi enseignant : il gere une classe ET enseigne ses matieres assignees. Une classe ne peut avoir qu'un seul titulaire.
                    </p>
                  )}
                </div>

                {form.role === "titulaire" && (
                  <div className="space-y-1">
                    <Label>Classe dont il est titulaire *</Label>
                    <Select
                      value={form.classId}
                      onValueChange={(v) => { setForm({ ...form, classId: v }); setSelectedCombos([]); setCreateError(""); }}
                    >
                      <SelectTrigger><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
                      <SelectContent>
                        {(classes || []).map((c) => (
                          <SelectItem key={c.id} value={String(c.id)} disabled={classesWithTitulaire.has(c.id)}>
                            {c.name}{classesWithTitulaire.has(c.id) ? " (titulaire deja assigne)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedClassHasTitulaire && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-1">
                        <AlertTriangle size={12} />
                        Cette classe a deja un titulaire. Veuillez choisir une autre classe.
                      </div>
                    )}
                  </div>
                )}

                {form.role === "titulaire" && form.classId && !selectedClassHasTitulaire && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <BookOpen size={14} />
                      Cours a enseigner dans cette classe ({selectedCombos.length} selectionne(s))
                    </Label>
                    {titulaireClassCombos.length === 0 ? (
                      <p className="text-sm text-muted-foreground bg-muted/40 rounded p-3">
                        Tous les cours de cette classe sont deja affectes a un enseignant.
                      </p>
                    ) : (
                      <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                        {Object.entries(titulaireSubjectGroups).map(([subjectName, combos]) => (
                          <div key={subjectName}>
                            {combos.map((combo) => (
                              <label key={combo.key} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/20 cursor-pointer">
                                <Checkbox
                                  checked={selectedCombos.includes(combo.key)}
                                  onCheckedChange={() => toggleCombo(combo.key)}
                                />
                                <span className="text-sm">{subjectName}</span>
                                <Badge variant="outline" className="text-xs ml-auto">Non affecte</Badge>
                              </label>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Seuls les cours sans enseignant de cette classe sont affiches.
                    </p>
                  </div>
                )}

                {form.role === "enseignant" && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <BookOpen size={14} />
                      Affecter aux cours ({selectedCombos.length} selectionne(s))
                    </Label>
                    {availableCombos.length === 0 ? (
                      <p className="text-sm text-muted-foreground bg-muted/40 rounded p-3">
                        Tous les cours sont deja affectes a un enseignant.
                      </p>
                    ) : (
                      <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                        {Object.entries(subjectGroups).map(([subjectName, combos]) => (
                          <div key={subjectName}>
                            <div className="px-3 py-1.5 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {subjectName}
                            </div>
                            {combos.map((combo) => (
                              <label key={combo.key} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/20 cursor-pointer">
                                <Checkbox
                                  checked={selectedCombos.includes(combo.key)}
                                  onCheckedChange={() => toggleCombo(combo.key)}
                                />
                                <span className="text-sm">{combo.className}</span>
                                <Badge variant="outline" className="text-xs ml-auto">Non affecte</Badge>
                              </label>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Un cours ne peut avoir qu'un seul enseignant. Seuls les cours sans enseignant sont affiches.
                    </p>
                  </div>
                )}

                {createError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                    <AlertTriangle size={12} />
                    {createError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending || selectedClassHasTitulaire}
                >
                  {createMutation.isPending ? "Creation en cours..." : "Creer le compte"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Personnel scolaire */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-base">Personnel scolaire</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="hidden md:grid px-5 py-2 grid-cols-12 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="col-span-4">Nom</span>
              <span className="col-span-2">Role</span>
              <span className="col-span-3">Classe / Cours</span>
              <span className="col-span-2 text-center">Statut</span>
              <span className="col-span-1 text-right">Actions</span>
            </div>
            {isLoading && <div className="px-5 py-8 text-center text-muted-foreground text-sm">Chargement...</div>}
            {!isLoading && personnel.length === 0 && (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">Aucun membre du personnel</div>
            )}
            {personnel.map(renderUserRow)}
          </div>
        </CardContent>
      </Card>

      {/* Parents */}
      {parents.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-base">Parents d'eleves</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <div className="hidden md:grid px-5 py-2 grid-cols-12 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span className="col-span-5">Nom</span>
                <span className="col-span-3">Role</span>
                <span className="col-span-2 text-center">Statut</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>
              {parents.map((u) => (
                <div key={u.id} className="px-4 sm:px-5 py-3 flex flex-col gap-2 md:grid md:grid-cols-12 md:gap-0 text-sm md:items-center hover:bg-muted/20">
                  <div className="flex items-center justify-between md:contents">
                    <span className="md:col-span-5 font-medium">{u.fullName}</span>
                    <Badge variant="outline" className="text-xs md:col-span-3 w-fit">Parent d'eleve</Badge>
                  </div>
                  <div className="flex items-center justify-between md:contents">
                    <div className="md:col-span-2 md:text-center">
                      {u.isFirstLogin ? (
                        <Badge variant="secondary" className="text-xs">En attente</Badge>
                      ) : (
                        <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">Actif</Badge>
                      )}
                    </div>
                    <div className="md:col-span-2 flex justify-end pt-1 md:pt-0">
                      <button
                        className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                        onClick={() => { if (confirm("Supprimer ce compte parent?")) deleteMutation.mutate({ id: u.id }); }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
