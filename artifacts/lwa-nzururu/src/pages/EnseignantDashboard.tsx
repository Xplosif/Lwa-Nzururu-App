import { useMemo } from "react";
import { Link } from "wouter";
import { useListCourseAssignments, useListGrades, getListGradesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, BookOpen, ArrowRight } from "lucide-react";

const CURRENT_YEAR = "2024-2025";
const PERIOD_LABELS: Record<string, string> = {
  P1: "P1", P2: "P2", exam_s1: "Exam S1", P3: "P3", P4: "P4", exam_s2: "Exam S2",
};

export default function EnseignantDashboard() {
  const { user } = useAuth();

  const { data: allAssignments } = useListCourseAssignments();
  const { data: allGrades } = useListGrades(
    { academicYear: CURRENT_YEAR },
    { query: { queryKey: getListGradesQueryKey({ academicYear: CURRENT_YEAR }) } }
  );

  const myAssignments = useMemo(
    () => (allAssignments || []).filter((a) => a.teacherId === user?.id),
    [allAssignments, user?.id]
  );

  const myClassIds = useMemo(() => [...new Set(myAssignments.map((a) => a.classId))], [myAssignments]);
  const mySubjectIds = useMemo(() => [...new Set(myAssignments.map((a) => a.subjectId))], [myAssignments]);

  const myGrades = useMemo(
    () => (allGrades || []).filter(
      (g) => mySubjectIds.includes(g.subjectId) && myClassIds.includes(g.classId)
    ),
    [allGrades, mySubjectIds, myClassIds]
  );

  const classSummaries = useMemo(() => {
    return myClassIds.map((classId) => {
      const classAssignments = myAssignments.filter((a) => a.classId === classId);
      const className = classAssignments[0]?.className || "Classe inconnue";
      const subjects = classAssignments.map((a) => ({ id: a.subjectId, name: a.subjectName }));
      const gradesForClass = myGrades.filter((g) => g.classId === classId);
      return { classId, className, subjects, gradeCount: gradesForClass.length };
    });
  }, [myClassIds, myAssignments, myGrades]);

  const recentGrades = useMemo(
    () => [...myGrades].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10),
    [myGrades]
  );

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Mon espace — Enseignant</h1>
        <p className="text-muted-foreground text-sm">Annee scolaire {CURRENT_YEAR}</p>
      </div>

      {myAssignments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              Aucun cours ne vous a encore ete assigne. Contactez le Proviseur.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-primary">
                  <BookOpen size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mes classes</p>
                  <p className="text-3xl font-bold">{myClassIds.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-blue-600">
                  <ClipboardList size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Notes encodees</p>
                  <p className="text-3xl font-bold">{myGrades.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Mes cours assignes</span>
                <Link href="/grades">
                  <Button size="sm" className="gap-1">
                    <ClipboardList size={14} /> Saisir des notes
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {classSummaries.map((cls) => (
                  <div key={cls.classId} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{cls.className}</span>
                      <span className="text-xs text-muted-foreground">{cls.gradeCount} note(s)</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cls.subjects.map((s) => (
                        <Badge key={s.id} variant="secondary" className="text-xs">{s.name}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {recentGrades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dernieres notes encodees</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentGrades.map((g) => (
                    <div key={g.id} className="px-5 py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{g.subjectName}</p>
                        <p className="text-xs text-muted-foreground">
                          {PERIOD_LABELS[g.period] || g.period} · {new Date(g.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <span className="font-mono font-bold">{g.points} / {g.maxPoints}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
