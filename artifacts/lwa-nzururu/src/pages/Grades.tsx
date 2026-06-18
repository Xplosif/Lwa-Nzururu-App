import { useState, useMemo } from "react";
import {
  useListGrades, getListGradesQueryKey, useCreateGrade, useDeleteGrade,
  useListClasses, useListSubjects, useListStudents, useListCourseAssignments,
  getListStudentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const PERIODS = [
  { value: "P1", label: "P1" }, { value: "P2", label: "P2" }, { value: "exam_s1", label: "Exam S1" },
  { value: "P3", label: "P3" }, { value: "P4", label: "P4" }, { value: "exam_s2", label: "Exam S2" },
];
const PERIODS_ALL = [...PERIODS, { value: "bonus", label: "Bonus" }];

const CURRENT_YEAR = "2024-2025";

export default function Grades() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEnseignant = user?.role === "enseignant";
  const isTitulaire = user?.role === "titulaire";
  const isRestricted = isEnseignant || isTitulaire;

  const [filterClassId, setFilterClassId] = useState<string>(() => {
    if ((isEnseignant || isTitulaire) && user?.classId) return String(user.classId);
    return "all";
  });
  const [filterSubjectId, setFilterSubjectId] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    studentId: "", subjectId: "", classId: "", period: "P1", points: "",
  });

  const { data: allAssignments } = useListCourseAssignments();
  const { data: allClasses } = useListClasses();
  const { data: allSubjects } = useListSubjects();

  const myAssignments = useMemo(
    () => (allAssignments || []).filter((a) => a.teacherId === user?.id),
    [allAssignments, user?.id]
  );

  const allowedClassIds = useMemo(() => {
    if (!isRestricted) return null;
    if (isTitulaire && user?.classId) return new Set([user.classId]);
    return new Set(myAssignments.map((a) => a.classId));
  }, [isRestricted, isTitulaire, myAssignments, user?.classId]);

  const allowedSubjectIdsForClass = useMemo(() => {
    if (!isRestricted) return null;
    const classIdNum = form.classId ? parseInt(form.classId) : null;
    if (!classIdNum) return new Set<number>();
    return new Set(myAssignments.filter((a) => a.classId === classIdNum).map((a) => a.subjectId));
  }, [isRestricted, myAssignments, form.classId]);

  const allowedSubjectIdsForFilter = useMemo(() => {
    if (!isEnseignant) return null;
    const classIdNum = filterClassId !== "all" ? parseInt(filterClassId) : null;
    if (!classIdNum) return new Set(myAssignments.map((a) => a.subjectId));
    return new Set(myAssignments.filter((a) => a.classId === classIdNum).map((a) => a.subjectId));
  }, [isEnseignant, myAssignments, filterClassId]);

  const filteredClasses = useMemo(() => {
    if (!allowedClassIds) return allClasses || [];
    return (allClasses || []).filter((c) => allowedClassIds.has(c.id));
  }, [allClasses, allowedClassIds]);

  const filteredSubjects = useMemo(() => {
    if (!isRestricted) return allSubjects || [];
    if (!allowedSubjectIdsForClass) return [];
    return (allSubjects || []).filter((s) => allowedSubjectIdsForClass.has(s.id));
  }, [allSubjects, isRestricted, allowedSubjectIdsForClass]);

  const filterBarSubjects = useMemo(() => {
    if (!isEnseignant) return allSubjects || [];
    if (!allowedSubjectIdsForFilter) return allSubjects || [];
    return (allSubjects || []).filter((s) => allowedSubjectIdsForFilter.has(s.id));
  }, [allSubjects, isEnseignant, allowedSubjectIdsForFilter]);

  const studentParams = filterClassId !== "all"
    ? { classId: parseInt(filterClassId), academicYear: CURRENT_YEAR }
    : { academicYear: CURRENT_YEAR };
  const { data: students } = useListStudents(studentParams, {
    query: { queryKey: getListStudentsQueryKey(studentParams) },
  });

  const gradeQuery: Record<string, string | number> = { academicYear: CURRENT_YEAR };
  if (isEnseignant && filterClassId === "all" && allowedClassIds && allowedClassIds.size > 0) {
    gradeQuery.classId = [...allowedClassIds][0];
  } else if (filterClassId !== "all") {
    gradeQuery.classId = parseInt(filterClassId);
  } else if (isTitulaire && user?.classId) {
    gradeQuery.classId = user.classId;
  }
  if (filterSubjectId !== "all") gradeQuery.subjectId = parseInt(filterSubjectId);

  const { data: grades, isLoading } = useListGrades(gradeQuery as any, {
    query: { queryKey: getListGradesQueryKey(gradeQuery as any) },
  });

  const displayGrades = useMemo(() => {
    let list = grades || [];
    if (isEnseignant) {
      const mySubjectIds = new Set(myAssignments.map((a) => a.subjectId));
      const myClassIds = allowedClassIds || new Set<number>();
      list = list.filter((g) => mySubjectIds.has(g.subjectId) && myClassIds.has(g.classId));
    } else if (isTitulaire && user?.classId) {
      list = list.filter((g) => g.classId === user.classId);
    }
    return list;
  }, [grades, isEnseignant, isTitulaire, myAssignments, allowedClassIds, user?.classId]);

  const createMutation = useCreateGrade({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGradesQueryKey() });
        setOpen(false);
        setForm({ studentId: "", subjectId: "", classId: form.classId, period: "P1", points: "" });
      },
    },
  });

  const deleteMutation = useDeleteGrade({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListGradesQueryKey() }) },
  });

  const canDelete = (grade: { subjectId: number; classId: number }) => {
    if (!isRestricted) return true;
    if (isEnseignant) {
      const mySubjectIds = new Set(myAssignments.map((a) => a.subjectId));
      return mySubjectIds.has(grade.subjectId);
    }
    if (isTitulaire) return true;
    return false;
  };

  const availablePeriods = isEnseignant ? PERIODS : PERIODS_ALL;

  const handleDialogOpen = (val: boolean) => {
    if (val && isRestricted && filteredClasses.length === 1) {
      setForm((f) => ({ ...f, classId: String(filteredClasses[0].id) }));
    }
    setOpen(val);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Notes</h1>
          <p className="text-muted-foreground text-sm">{displayGrades.length} entree(s)</p>
        </div>
        <Dialog open={open} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 w-full sm:w-auto">
              <Plus size={16} /> Saisir une note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Saisir une note</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({
                  data: {
                    studentId: parseInt(form.studentId),
                    subjectId: parseInt(form.subjectId),
                    classId: parseInt(form.classId),
                    period: form.period as any,
                    points: parseFloat(form.points),
                    academicYear: CURRENT_YEAR,
                  },
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <Label>Classe *</Label>
                {isTitulaire && user?.classId ? (
                  <Input value={user.className || String(user.classId)} disabled />
                ) : (
                  <Select
                    value={form.classId}
                    onValueChange={(v) => setForm({ ...form, classId: v, studentId: "", subjectId: "" })}
                  >
                    <SelectTrigger><SelectValue placeholder="Choisir classe" /></SelectTrigger>
                    <SelectContent>
                      {filteredClasses.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1">
                <Label>Matiere *</Label>
                <Select
                  value={form.subjectId}
                  onValueChange={(v) => setForm({ ...form, subjectId: v })}
                  disabled={isEnseignant && !form.classId}
                >
                  <SelectTrigger><SelectValue placeholder="Choisir matiere" /></SelectTrigger>
                  <SelectContent>
                    {filteredSubjects.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Eleve *</Label>
                <Select
                  value={form.studentId}
                  onValueChange={(v) => setForm({ ...form, studentId: v })}
                  disabled={!form.classId && !isTitulaire}
                >
                  <SelectTrigger><SelectValue placeholder="Choisir eleve" /></SelectTrigger>
                  <SelectContent>
                    {(students || []).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Periode *</Label>
                  <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {availablePeriods.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Points *</Label>
                  <Input
                    type="number" min="0" step="0.5"
                    value={form.points}
                    onChange={(e) => setForm({ ...form, points: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Enregistrement..." : "Enregistrer la note"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {!(isTitulaire && user?.classId) && (
          <Select value={filterClassId} onValueChange={setFilterClassId}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Toutes les classes" />
            </SelectTrigger>
            <SelectContent>
              {!isRestricted && <SelectItem value="all">Toutes les classes</SelectItem>}
              {filteredClasses.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={filterSubjectId} onValueChange={setFilterSubjectId}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Toutes les matieres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les matieres</SelectItem>
            {(isTitulaire ? allSubjects || [] : filterBarSubjects).map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isEnseignant && (
        <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
          Vous voyez uniquement les notes des matieres qui vous sont assignees. Pour saisir des notes, selectionnez d'abord la classe puis la matiere.
        </div>
      )}
      {isTitulaire && (
        <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
          Vous voyez toutes les notes de votre classe ({user?.className}). Vous pouvez saisir des notes pour vos propres matieres uniquement.
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="hidden md:grid px-5 py-2 grid-cols-12 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="col-span-3">Eleve</span>
              <span className="col-span-3">Matiere</span>
              <span className="col-span-2 text-center">Periode</span>
              <span className="col-span-2 text-center">Points</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>
            {isLoading && (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">Chargement...</div>
            )}
            {!isLoading && displayGrades.length === 0 && (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">Aucune note</div>
            )}
            {displayGrades.map((g) => (
              <div
                key={g.id}
                className="px-4 sm:px-5 py-2.5 flex flex-col gap-1 md:grid md:grid-cols-12 md:gap-0 text-sm md:items-center hover:bg-muted/20"
              >
                <div className="flex items-center justify-between md:contents">
                  <span className="md:col-span-3 text-muted-foreground text-xs">Eleve #{g.studentId}</span>
                  <span className="md:col-span-3 font-medium">{g.subjectName}</span>
                </div>
                <div className="flex items-center justify-between md:contents">
                  <span className="md:col-span-2 md:text-center text-muted-foreground text-xs">
                    {PERIODS_ALL.find((p) => p.value === g.period)?.label ?? g.period}
                  </span>
                  <span className="md:col-span-2 md:text-center font-bold">{g.points}/{g.maxPoints}</span>
                  <div className="md:col-span-2 flex justify-end">
                    {canDelete(g) && (
                      <button
                        className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                        onClick={() => {
                          if (confirm("Supprimer cette note?")) deleteMutation.mutate({ id: g.id });
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
