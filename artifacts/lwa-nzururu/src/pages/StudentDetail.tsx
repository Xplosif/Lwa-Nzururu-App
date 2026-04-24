import { useRoute, Link } from "wouter";
import { useGetStudent, getGetStudentQueryKey } from "@workspace/api-client-react";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PERIODS = ["P1", "P2", "exam_s1", "P3", "P4", "exam_s2", "bonus"];
const PERIOD_LABELS: Record<string, string> = {
  P1: "P1", P2: "P2", exam_s1: "Exam S1", P3: "P3", P4: "P4", exam_s2: "Exam S2", bonus: "Bonus",
};

export default function StudentDetail() {
  const [, params] = useRoute("/students/:id");
  const studentId = parseInt(params?.id || "0");

  const { data: student, isLoading } = useGetStudent(studentId, {
    query: { enabled: !!studentId, queryKey: getGetStudentQueryKey(studentId) },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Chargement...</div>;
  if (!student) return <div className="p-8 text-muted-foreground">Eleve introuvable</div>;

  const subjectMap = new Map<number, { name: string; grades: Record<string, number> }>();
  for (const g of student.grades || []) {
    if (!subjectMap.has(g.subjectId)) {
      subjectMap.set(g.subjectId, { name: g.subjectName, grades: {} });
    }
    subjectMap.get(g.subjectId)!.grades[g.period] = g.points;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/students">
          <button className="p-1.5 rounded hover:bg-muted flex-shrink-0"><ArrowLeft size={18} /></button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold truncate">{student.firstName} {student.lastName}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm truncate">{student.registrationNumber} · {student.className}</p>
        </div>
        <Badge variant={student.gender === "M" ? "default" : "destructive"} className="flex-shrink-0">
          {student.gender === "M" ? "Garcon" : "Fille"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Informations personnelles</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1.5">
            {student.dateOfBirth && <div><span className="text-muted-foreground">Naissance: </span>{student.dateOfBirth}</div>}
            {student.placeOfBirth && <div><span className="text-muted-foreground">Lieu: </span>{student.placeOfBirth}</div>}
            {student.fatherName && <div><span className="text-muted-foreground">Pere: </span>{student.fatherName}</div>}
            {student.motherName && <div><span className="text-muted-foreground">Mere: </span>{student.motherName}</div>}
            {student.address && <div><span className="text-muted-foreground">Adresse: </span>{student.address}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Resultats globaux</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {student.percentage != null ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pourcentage</span>
                  <span className={`font-bold ${(student.percentage || 0) >= 50 ? "text-green-600" : "text-destructive"}`}>
                    {student.percentage?.toFixed(2)}%
                  </span>
                </div>
                {student.rank && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Classement</span>
                    <span className="font-bold">{student.rank}e</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Decision</span>
                  <Badge variant={(student.percentage || 0) >= 50 ? "default" : "destructive"}>
                    {(student.percentage || 0) >= 50 ? "Admis(e)" : "Echoue(e)"}
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Aucune note enregistree</p>
            )}
          </CardContent>
        </Card>
      </div>

      {subjectMap.size > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Notes par matiere et periode</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Matiere</th>
                  {PERIODS.map((p) => (
                    <th key={p} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground">
                      {PERIOD_LABELS[p]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(subjectMap.entries()).map(([subjectId, { name, grades }]) => (
                  <tr key={subjectId} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-2 font-medium">{name}</td>
                    {PERIODS.map((p) => (
                      <td key={p} className="px-2 py-2 text-center text-muted-foreground">
                        {grades[p] != null ? grades[p] : <span className="text-muted-foreground/30">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Link href={`/reports?studentId=${student.id}`}>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
            Generer le bulletin PDF
          </button>
        </Link>
      </div>
    </div>
  );
}
