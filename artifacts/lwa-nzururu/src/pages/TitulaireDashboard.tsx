import { useMemo } from "react";
import { Link } from "wouter";
import {
  useListStudents, useListGrades, useListCourseAssignments,
  getListStudentsQueryKey, getListGradesQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, ClipboardList, FileText, Users } from "lucide-react";

const CURRENT_YEAR = "2024-2025";
const PASS_THRESHOLD = 50;
const PERIOD_LABELS: Record<string, string> = {
  P1: "P1", P2: "P2", exam_s1: "Exam S1", P3: "P3", P4: "P4", exam_s2: "Exam S2",
};

export default function TitulaireDashboard() {
  const { user } = useAuth();
  const classId = user?.classId;

  const studentsParams = { classId: classId || 0, academicYear: CURRENT_YEAR };
  const { data: students } = useListStudents(studentsParams, {
    query: { enabled: !!classId, queryKey: getListStudentsQueryKey(studentsParams) },
  });

  const gradesParams = { classId: classId || 0, academicYear: CURRENT_YEAR };
  const { data: classGrades } = useListGrades(gradesParams, {
    query: { enabled: !!classId, queryKey: getListGradesQueryKey(gradesParams) },
  });

  const { data: allAssignments } = useListCourseAssignments();

  const myAssignments = useMemo(
    () => (allAssignments || []).filter((a) => a.teacherId === user?.id),
    [allAssignments, user?.id]
  );

  const mySubjectIds = useMemo(() => new Set(myAssignments.map((a) => a.subjectId)), [myAssignments]);

  const teacherMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const a of allAssignments || []) {
      if (a.classId === classId) map.set(a.subjectId, a.teacherName);
    }
    return map;
  }, [allAssignments, classId]);

  const studentStats = useMemo(() => {
    if (!students || !classGrades) return [];
    return students.map((s) => {
      const sg = classGrades.filter((g) => g.studentId === s.id);
      const total = sg.reduce((sum, g) => sum + g.points * g.coefficient, 0);
      const max = sg.reduce((sum, g) => sum + g.maxPoints * g.coefficient, 0);
      const pct = max > 0 ? (total / max) * 100 : null;
      return { ...s, percentage: pct, gradeCount: sg.length };
    }).sort((a, b) => (b.percentage ?? -1) - (a.percentage ?? -1));
  }, [students, classGrades]);

  const passCount = studentStats.filter((s) => s.percentage !== null && s.percentage >= PASS_THRESHOLD).length;

  const recentGrades = useMemo(
    () => [...(classGrades || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 12),
    [classGrades]
  );

  if (!classId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Aucune classe assignee a votre compte. Contactez le Proviseur.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Mon espace — Titulaire</h1>
          <p className="text-muted-foreground text-sm">
            Classe : <strong>{user?.className || "—"}</strong> · Annee {CURRENT_YEAR}
          </p>
        </div>
        <Link href="/proclamation">
          <Button size="sm" variant="outline" className="gap-1.5">
            <FileText size={14} /> Proclamation
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Eleves</p>
              <p className="text-2xl font-bold">{students?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-600">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En voie de reussite</p>
              <p className="text-2xl font-bold text-green-600">{passCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600">
              <ClipboardList size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Notes totales</p>
              <p className="text-2xl font-bold">{classGrades?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Classement provisoire de ma classe</span>
              <Link href="/proclamation">
                <Button size="sm" variant="ghost" className="text-xs">Voir tout</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {studentStats.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">Aucun eleve enregistre.</p>
            ) : (
              <div className="divide-y max-h-64 overflow-y-auto">
                {studentStats.slice(0, 10).map((s, idx) => (
                  <div key={s.id} className="px-4 py-2.5 flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-5">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.lastName} {s.firstName}</p>
                      <p className="text-xs text-muted-foreground">{s.gradeCount} notes</p>
                    </div>
                    {s.percentage !== null ? (
                      <div className="text-right">
                        <span className={`text-sm font-bold ${s.percentage >= PASS_THRESHOLD ? "text-green-600" : "text-destructive"}`}>
                          {s.percentage.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Flux des dernieres notes</span>
              <Link href="/grades">
                <Button size="sm" className="gap-1 text-xs">
                  <ClipboardList size={13} /> Saisir
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentGrades.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">Aucune note encodee.</p>
            ) : (
              <div className="divide-y max-h-64 overflow-y-auto">
                {recentGrades.map((g) => (
                  <div key={g.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{g.subjectName}</p>
                      <p className="text-xs text-muted-foreground">
                        {teacherMap.get(g.subjectId) || "—"} · {PERIOD_LABELS[g.period] || g.period}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm">{g.points}/{g.maxPoints}</span>
                      {mySubjectIds.has(g.subjectId) && (
                        <Badge variant="outline" className="ml-1 text-xs">Moi</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
