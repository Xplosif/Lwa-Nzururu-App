import { useState } from "react";
import {
  useListGrades, getListGradesQueryKey, useCreateGrade, useUpdateGrade, useDeleteGrade,
  useListClasses, useListSubjects, useListStudents, getListStudentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const PERIODS = [
  { value: "P1", label: "P1" }, { value: "P2", label: "P2" }, { value: "exam_s1", label: "Exam S1" },
  { value: "P3", label: "P3" }, { value: "P4", label: "P4" }, { value: "exam_s2", label: "Exam S2" },
  { value: "bonus", label: "Bonus" },
];

const CURRENT_YEAR = "2024-2025";

export default function Grades() {
  const queryClient = useQueryClient();
  const [filterClassId, setFilterClassId] = useState<string>("all");
  const [filterSubjectId, setFilterSubjectId] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ studentId: "", subjectId: "", classId: "", period: "P1", points: "" });

  const { data: classes } = useListClasses();
  const { data: subjects } = useListSubjects();

  const classQuery = filterClassId !== "all" ? { classId: parseInt(filterClassId), academicYear: CURRENT_YEAR } : { academicYear: CURRENT_YEAR };
  const { data: students } = useListStudents(classQuery, { query: { queryKey: getListStudentsQueryKey(classQuery) } });

  const gradeQuery: any = {};
  if (filterClassId !== "all") gradeQuery.classId = parseInt(filterClassId);
  if (filterSubjectId !== "all") gradeQuery.subjectId = parseInt(filterSubjectId);
  gradeQuery.academicYear = CURRENT_YEAR;

  const { data: grades, isLoading } = useListGrades(gradeQuery, {
    query: { queryKey: getListGradesQueryKey(gradeQuery) },
  });

  const createMutation = useCreateGrade({
    mutation: {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListGradesQueryKey() }); setOpen(false); setForm({ studentId: "", subjectId: "", classId: "", period: "P1", points: "" }); },
    },
  });

  const deleteMutation = useDeleteGrade({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListGradesQueryKey() }) },
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-muted-foreground text-sm">{(grades || []).length} entree(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus size={16} /> Saisir une note</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Saisir une note</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ data: { studentId: parseInt(form.studentId), subjectId: parseInt(form.subjectId), classId: parseInt(form.classId), period: form.period as any, points: parseFloat(form.points), academicYear: CURRENT_YEAR } }); }} className="space-y-4">
              <div className="space-y-1">
                <Label>Classe *</Label>
                <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir classe" /></SelectTrigger>
                  <SelectContent>{(classes || []).map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Eleve *</Label>
                <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })} disabled={!form.classId}>
                  <SelectTrigger><SelectValue placeholder="Choisir eleve" /></SelectTrigger>
                  <SelectContent>{(students || []).map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Matiere *</Label>
                <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir matiere" /></SelectTrigger>
                  <SelectContent>{(subjects || []).map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Periode *</Label>
                  <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Points *</Label>
                  <Input type="number" min="0" step="0.5" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Enregistrement..." : "Enregistrer la note"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <Select value={filterClassId} onValueChange={setFilterClassId}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Toutes les classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            {(classes || []).map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSubjectId} onValueChange={setFilterSubjectId}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Toutes les matieres" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les matieres</SelectItem>
            {(subjects || []).map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="px-5 py-2 grid grid-cols-12 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="col-span-3">Eleve</span>
              <span className="col-span-3">Matiere</span>
              <span className="col-span-2 text-center">Periode</span>
              <span className="col-span-2 text-center">Points</span>
              <span className="col-span-2 text-right">Suppr.</span>
            </div>
            {isLoading && <div className="px-5 py-8 text-center text-muted-foreground text-sm">Chargement...</div>}
            {!isLoading && (grades || []).length === 0 && (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">Aucune note</div>
            )}
            {(grades || []).map((g) => (
              <div key={g.id} className="px-5 py-2.5 grid grid-cols-12 text-sm items-center hover:bg-muted/20">
                <span className="col-span-3 text-muted-foreground text-xs">ID {g.studentId}</span>
                <span className="col-span-3 font-medium">{g.subjectName}</span>
                <span className="col-span-2 text-center text-muted-foreground">{PERIODS.find(p => p.value === g.period)?.label}</span>
                <span className="col-span-2 text-center font-bold">{g.points}/{g.maxPoints}</span>
                <div className="col-span-2 flex justify-end">
                  <button className="p-1.5 rounded hover:bg-destructive/10 text-destructive" onClick={() => { if (confirm("Supprimer cette note?")) deleteMutation.mutate({ id: g.id }); }}>
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
