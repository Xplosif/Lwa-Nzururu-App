import { useState } from "react";
import { useListClasses, getListClassesQueryKey, useCreateClass, useDeleteClass } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const CURRENT_YEAR = "2024-2025";

export default function Classes() {
  const queryClient = useQueryClient();
  const { data: classes, isLoading } = useListClasses();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", level: "", section: "", room: "" });

  const createMutation = useCreateClass({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
        setForm({ name: "", level: "", section: "", room: "" });
        setOpen(false);
      },
    },
  });

  const deleteMutation = useDeleteClass({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() }) },
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Classes</h1>
          <p className="text-muted-foreground text-sm">{(classes || []).length} classes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 w-full sm:w-auto"><Plus size={16} /> Creer une classe</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle classe</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ data: { name: form.name, level: form.level, section: form.section || undefined, room: form.room || undefined, academicYear: CURRENT_YEAR } }); }} className="space-y-4">
              <div className="space-y-1"><Label>Nom de la classe *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: 7eme A" required /></div>
              <div className="space-y-1"><Label>Niveau *</Label><Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="Ex: 7eme" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Section</Label><Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="A, B, C..." /></div>
                <div className="space-y-1"><Label>Salle</Label><Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Salle 01" /></div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creation..." : "Creer la classe"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="hidden md:grid px-5 py-2 grid-cols-12 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="col-span-3">Nom</span>
              <span className="col-span-2">Niveau</span>
              <span className="col-span-2">Section</span>
              <span className="col-span-2">Salle</span>
              <span className="col-span-2">Eleves</span>
              <span className="col-span-1 text-right">Suppr.</span>
            </div>
            {isLoading && <div className="px-5 py-8 text-center text-muted-foreground text-sm">Chargement...</div>}
            {!isLoading && (classes || []).length === 0 && (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">Aucune classe</div>
            )}
            {(classes || []).map((c) => (
              <div key={c.id} className="px-4 sm:px-5 py-3 flex flex-col gap-2 md:grid md:grid-cols-12 md:gap-0 text-sm md:items-center hover:bg-muted/20">
                <div className="flex items-center justify-between md:contents">
                  <span className="md:col-span-3 font-medium">{c.name}</span>
                  <span className="md:col-span-2 text-muted-foreground text-xs md:text-sm">{c.level}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 md:contents text-xs md:text-sm">
                  <span className="md:col-span-2 text-muted-foreground"><span className="md:hidden text-[10px] block">Section</span>{c.section || "-"}</span>
                  <span className="md:col-span-2 text-muted-foreground"><span className="md:hidden text-[10px] block">Salle</span>{c.room || "-"}</span>
                  <span className="md:col-span-2 font-medium"><span className="md:hidden text-[10px] block text-muted-foreground">Eleves</span>{c.studentCount}</span>
                </div>
                <div className="md:col-span-1 flex justify-end pt-1 md:pt-0 border-t md:border-t-0 border-border/60">
                  <button className="p-1.5 rounded hover:bg-destructive/10 text-destructive" onClick={() => { if (confirm("Supprimer cette classe?")) deleteMutation.mutate({ id: c.id }); }}>
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
