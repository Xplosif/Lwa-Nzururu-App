import { useState } from "react";
import { useListArchives, getListArchivesQueryKey, useCreateArchive } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Archives() {
  const queryClient = useQueryClient();
  const { data: archives, isLoading } = useListArchives();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ academicYear: "", notes: "" });

  const createMutation = useCreateArchive({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListArchivesQueryKey() });
        setForm({ academicYear: "", notes: "" });
        setOpen(false);
      },
    },
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Archives annuelles</h1>
          <p className="text-muted-foreground text-sm">{(archives || []).length} annee(s) archivee(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 w-full sm:w-auto"><Plus size={16} /> Archiver une annee</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Archiver une annee scolaire</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ data: { academicYear: form.academicYear, notes: form.notes || undefined } }); }} className="space-y-4">
              <div className="space-y-1">
                <Label>Annee scolaire *</Label>
                <Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder="Ex: 2024-2025" required />
              </div>
              <div className="space-y-1">
                <Label>Notes (optionnel)</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Remarques sur cette annee scolaire..." />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
                L'archivage calcule automatiquement les statistiques de l'annee selectionnee.
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Archivage en cours..." : "Archiver"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : (archives || []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Archive size={40} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Aucune archive</p>
            <p className="text-sm text-muted-foreground mt-1">Archivez une annee scolaire terminee pour conserver ses donnees.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(archives || []).map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{a.academicYear}</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      Archive le {new Date(a.archivedAt).toLocaleDateString("fr-FR")} par {a.createdBy}
                    </p>
                    {a.notes && <p className="text-sm mt-2 italic text-muted-foreground">"{a.notes}"</p>}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-2xl font-bold text-primary">{a.overallPassRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">taux de reussite</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border text-sm">
                  <div><span className="text-muted-foreground">Total eleves: </span><strong>{a.totalStudents}</strong></div>
                  <div><span className="text-muted-foreground">Total classes: </span><strong>{a.totalClasses}</strong></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
