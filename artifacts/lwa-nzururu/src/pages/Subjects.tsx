import { useState } from "react";
import { useListSubjects, getListSubjectsQueryKey, useCreateSubject, useDeleteSubject } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Subjects() {
  const queryClient = useQueryClient();
  const { data: subjects, isLoading } = useListSubjects();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", coefficient: "1", maxPoints: "100", category: "" });

  const createMutation = useCreateSubject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
        setForm({ name: "", coefficient: "1", maxPoints: "100", category: "" });
        setOpen(false);
      },
    },
  });

  const deleteMutation = useDeleteSubject({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() }) },
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Matieres</h1>
          <p className="text-muted-foreground text-sm">{(subjects || []).length} matieres</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 w-full sm:w-auto"><Plus size={16} /> Ajouter une matiere</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle matiere</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ data: { name: form.name, coefficient: parseFloat(form.coefficient), maxPoints: parseFloat(form.maxPoints), category: form.category || undefined } }); }} className="space-y-4">
              <div className="space-y-1"><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Coefficient *</Label><Input type="number" step="0.5" min="0.5" value={form.coefficient} onChange={(e) => setForm({ ...form, coefficient: e.target.value })} required /></div>
                <div className="space-y-1"><Label>Max points *</Label><Input type="number" min="1" value={form.maxPoints} onChange={(e) => setForm({ ...form, maxPoints: e.target.value })} required /></div>
              </div>
              <div className="space-y-1"><Label>Categorie</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Sciences, Langues..." /></div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Ajout..." : "Ajouter"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="hidden md:grid px-5 py-2 grid-cols-12 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="col-span-4">Matiere</span>
              <span className="col-span-2 text-center">Coeff.</span>
              <span className="col-span-2 text-center">Max pts</span>
              <span className="col-span-3">Categorie</span>
              <span className="col-span-1 text-right">Suppr.</span>
            </div>
            {isLoading && <div className="px-5 py-8 text-center text-muted-foreground text-sm">Chargement...</div>}
            {(subjects || []).map((s) => (
              <div key={s.id} className="px-4 sm:px-5 py-3 flex flex-col gap-2 md:grid md:grid-cols-12 md:gap-0 text-sm md:items-center hover:bg-muted/20">
                <div className="flex items-center justify-between md:contents">
                  <span className="md:col-span-4 font-medium">{s.name}</span>
                  <span className="md:col-span-2 md:text-center text-xs md:text-sm"><span className="md:hidden text-muted-foreground">Coef. </span>{s.coefficient}</span>
                </div>
                <div className="flex items-center justify-between md:contents">
                  <span className="md:col-span-2 md:text-center text-muted-foreground text-xs md:text-sm"><span className="md:hidden">Max </span>{s.maxPoints}pts</span>
                  <span className="md:col-span-3 text-muted-foreground text-xs md:text-sm">{s.category || "Generale"}</span>
                </div>
                <div className="md:col-span-1 flex justify-end pt-1 md:pt-0 border-t md:border-t-0 border-border/60">
                  <button className="p-1.5 rounded hover:bg-destructive/10 text-destructive" onClick={() => { if (confirm("Supprimer cette matiere?")) deleteMutation.mutate({ id: s.id }); }}>
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
