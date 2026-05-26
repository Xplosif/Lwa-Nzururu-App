import { useState } from "react";
import { useGetParentBulletin, getGetParentBulletinQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CURRENT_YEAR = "2024-2025";

const PERIOD_LABELS: Record<string, string> = {
  P1: "P1",
  P2: "P2",
  exam_s1: "Exam S1",
  P3: "P3",
  P4: "P4",
  exam_s2: "Exam S2",
};

export default function ParentBulletin() {
  const [semester, setSemester] = useState<"S1" | "S2">("S1");

  const semesterPeriods = semester === "S1"
    ? ["P1", "P2", "exam_s1"]
    : ["P3", "P4", "exam_s2"];

  const bulletinParams = { academicYear: CURRENT_YEAR, semester };
  const { data, isLoading, error, refetch } = useGetParentBulletin(bulletinParams, {
    query: { enabled: true, queryKey: getGetParentBulletinQueryKey(bulletinParams) },
  });

  const errorMsg = (error as any)?.response?.data?.error || (error as any)?.message;

  const handlePrint = () => window.print();

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Bulletin de resultats</h1>
        {data && (
          <Button variant="outline" onClick={handlePrint}>
            Imprimer
          </Button>
        )}
      </div>

      <div className="flex gap-3 items-center print:hidden">
        <label className="text-sm font-medium">Semestre :</label>
        <Select value={semester} onValueChange={(v) => { setSemester(v as "S1" | "S2"); }}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="S1">1er semestre</SelectItem>
            <SelectItem value="S2">2e semestre</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Actualiser
        </Button>
      </div>

      {isLoading && (
        <p className="text-muted-foreground">Chargement...</p>
      )}

      {!isLoading && error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-amber-800 font-medium">Resultats non disponibles</p>
            <p className="text-amber-700 text-sm mt-1">
              {errorMsg || "Les resultats de ce semestre ne sont pas encore disponibles. Veuillez patienter que le Proviseur approuve la deliberation."}
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <Card className="print:shadow-none print:border-0">
            <CardHeader className="pb-3">
              <div className="text-center space-y-1">
                <p className="font-bold text-lg">Institut Lwa-Nzururu</p>
                <p className="text-sm text-muted-foreground">Butembo, Nord-Kivu, RDC</p>
                <p className="font-semibold mt-2">BULLETIN DE RESULTATS — {data.semester === "S1" ? "1ER SEMESTRE" : "2E SEMESTRE"}</p>
                <p className="text-sm">Annee academique : {data.academicYear}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm border rounded p-3 bg-muted/30">
                <div><span className="font-medium">Eleve :</span> {data.fullName}</div>
                <div><span className="font-medium">Classe :</span> {data.className}</div>
                <div><span className="font-medium">N° matricule :</span> {data.registrationNumber}</div>
                <div><span className="font-medium">Annee :</span> {data.academicYear}</div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium">Cours</th>
                      <th className="text-center p-2 font-medium">Coef.</th>
                      {semesterPeriods.map((p) => (
                        <th key={p} className="text-center p-2 font-medium">{PERIOD_LABELS[p]}</th>
                      ))}
                      <th className="text-right p-2 font-medium">Total / {semesterPeriods.length > 1 ? "Max" : ""}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.gradesBySubject || []).map((row: any) => {
                      const semTotal = row.semesterTotal;
                      const maxForPeriods = row.maxPoints * semesterPeriods.length;
                      return (
                        <tr key={row.subjectId} className="border-b hover:bg-muted/20">
                          <td className="p-2">{row.subjectName}</td>
                          <td className="p-2 text-center text-muted-foreground">{row.coefficient}</td>
                          {semesterPeriods.map((p) => (
                            <td key={p} className="p-2 text-center font-mono">
                              {row[p] !== null && row[p] !== undefined
                                ? Number(row[p]).toFixed(1)
                                : <span className="text-muted-foreground">—</span>}
                            </td>
                          ))}
                          <td className="p-2 text-right font-mono">
                            {semTotal !== null
                              ? `${Number(semTotal).toFixed(1)} / ${maxForPeriods}`
                              : <span className="text-muted-foreground">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="border rounded p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Total obtenu :</span>
                    <span className="font-mono">{data.totalPoints.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total maximum :</span>
                    <span className="font-mono">{data.maxTotalPoints.toFixed(0)}</span>
                  </div>
                  {data.bonusPoints > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span className="font-medium">Points de deliberation :</span>
                      <span className="font-mono">+{data.bonusPoints}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base border-t pt-2">
                    <span>Pourcentage :</span>
                    <span className="font-mono">{data.percentage.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="border rounded p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Rang dans la classe :</span>
                    <span className="font-mono font-bold">
                      {data.rank !== null ? `${data.rank}e / ${data.totalStudentsInClass}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-medium">Resultat :</span>
                    <Badge variant={data.passed ? "default" : "destructive"} className="text-base px-4 py-1">
                      {data.passed ? "ADMIS(E)" : "ECHOUE(E)"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
