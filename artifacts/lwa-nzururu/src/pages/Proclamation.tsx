import { useState, useMemo } from "react";
import {
  useListStudents,
  useListGrades,
  getListStudentsQueryKey,
  getListGradesQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CURRENT_YEAR = "2024-2025";
const PASS_THRESHOLD = 50;

const PERIODS = ["P1", "P2", "exam_s1", "P3", "P4", "exam_s2", "bonus"];
const PERIOD_LABELS: Record<string, string> = {
  P1: "P1", P2: "P2", exam_s1: "Exam S1", P3: "P3", P4: "P4", exam_s2: "Exam S2", bonus: "Bonus",
};

export default function Proclamation() {
  const { user } = useAuth();
  const classId = user?.classId;
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  const studentsParams = { classId: classId || 0, academicYear: CURRENT_YEAR };
  const gradesParams = { classId: classId || 0, academicYear: CURRENT_YEAR };

  const { data: students, isLoading: loadingStudents } = useListStudents(studentsParams, {
    query: { enabled: !!classId, queryKey: getListStudentsQueryKey(studentsParams) },
  });

  const { data: allGrades, isLoading: loadingGrades } = useListGrades(gradesParams, {
    query: { enabled: !!classId, queryKey: getListGradesQueryKey(gradesParams) },
  });

  const rankings = useMemo(() => {
    if (!students || !allGrades) return [];

    return students
      .map((student) => {
        const studentGrades = allGrades.filter((g) => g.studentId === student.id);

        const filteredGrades = periodFilter === "all"
          ? studentGrades
          : studentGrades.filter((g) => g.period === periodFilter);

        const totalPoints = filteredGrades.reduce((sum, g) => sum + g.points * g.coefficient, 0);
        const maxPoints = filteredGrades.reduce((sum, g) => sum + g.maxPoints * g.coefficient, 0);

        const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
        const passed = percentage >= PASS_THRESHOLD;

        return {
          student,
          totalPoints,
          maxPoints,
          percentage,
          passed,
          gradeCount: filteredGrades.length,
        };
      })
      .sort((a, b) => b.percentage - a.percentage)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [students, allGrades, periodFilter]);

  const isLoading = loadingStudents || loadingGrades;

  if (!classId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Aucune classe assignee a votre compte.</p>
      </div>
    );
  }

  const totalStudents = rankings.length;
  const passed = rankings.filter((r) => r.passed).length;
  const failed = totalStudents - passed;
  const passRate = totalStudents > 0 ? Math.round((passed / totalStudents) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Proclamation des resultats</h1>
          <p className="text-muted-foreground text-sm">Classe: {user?.className || "Ma classe"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Toutes periodes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes periodes</SelectItem>
              {PERIODS.map((p) => (
                <SelectItem key={p} value={p}>{PERIOD_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="print:hidden"
          >
            Imprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold">{totalStudents}</p>
            <p className="text-xs text-muted-foreground">Total eleves</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-green-600">{passed}</p>
            <p className="text-xs text-muted-foreground">Admis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-destructive">{failed}</p>
            <p className="text-xs text-muted-foreground">Echoues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold">{passRate}%</p>
            <p className="text-xs text-muted-foreground">Taux de reussite</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Palmares — {periodFilter === "all" ? "Cumul annuel" : PERIOD_LABELS[periodFilter]}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground text-xs uppercase">Rang</th>
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground text-xs uppercase">Nom complet</th>
                  <th className="text-center px-4 py-2 font-semibold text-muted-foreground text-xs uppercase">Points</th>
                  <th className="text-center px-4 py-2 font-semibold text-muted-foreground text-xs uppercase">%</th>
                  <th className="text-center px-4 py-2 font-semibold text-muted-foreground text-xs uppercase">Resultat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Chargement...</td></tr>
                )}
                {!isLoading && rankings.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Aucun resultat disponible</td></tr>
                )}
                {rankings.map((entry) => (
                  <tr key={entry.student.id} className={`hover:bg-muted/20 ${!entry.passed ? "bg-destructive/5" : ""}`}>
                    <td className="px-4 py-2.5 font-bold text-center w-12">
                      {entry.rank <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${entry.rank === 1 ? "bg-yellow-500" : entry.rank === 2 ? "bg-gray-400" : "bg-amber-600"}`}>
                          {entry.rank}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{entry.rank}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium">{entry.student.lastName} {entry.student.firstName}</span>
                      {entry.student.postnom && <span className="text-muted-foreground"> {entry.student.postnom}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center tabular-nums">
                      {entry.gradeCount > 0 ? `${entry.totalPoints.toFixed(1)} / ${entry.maxPoints}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-center tabular-nums font-medium">
                      {entry.gradeCount > 0 ? `${entry.percentage.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {entry.gradeCount > 0 ? (
                        <Badge
                          variant={entry.passed ? "default" : "destructive"}
                          className={`text-xs ${entry.passed ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}`}
                        >
                          {entry.passed ? "Admis" : "Echoue"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">En attente</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
