import { useState } from "react";
import {
  useGenerateBulletin, getGenerateBulletinQueryKey,
  useGeneratePalmares, getGeneratePalmaresQueryKey,
  useListClasses, useListStudents, getListStudentsQueryKey,
} from "@workspace/api-client-react";
import { FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const CURRENT_YEAR = "2024-2025";
const PERIODS = ["P1", "P2", "exam_s1", "P3", "P4", "exam_s2", "bonus"];
const PERIOD_LABELS: Record<string, string> = { P1: "P1", P2: "P2", exam_s1: "Exm S1", P3: "P3", P4: "P4", exam_s2: "Exm S2", bonus: "Bonus" };

export default function Reports() {
  const [mode, setMode] = useState<"bulletin" | "palmares">("bulletin");
  const [classId, setClassId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");

  const { data: classes } = useListClasses();
  const classQuery = classId ? { classId: parseInt(classId), academicYear: CURRENT_YEAR } : undefined;
  const { data: students } = useListStudents(
    classQuery || { academicYear: CURRENT_YEAR },
    { query: { queryKey: getListStudentsQueryKey(classQuery || { academicYear: CURRENT_YEAR }), enabled: !!classId } }
  );

  const bulletinQuery = studentId ? { studentId: parseInt(studentId), academicYear: CURRENT_YEAR } : null;
  const { data: bulletin } = useGenerateBulletin(
    parseInt(studentId || "0"),
    { academicYear: CURRENT_YEAR },
    { query: { enabled: !!studentId, queryKey: getGenerateBulletinQueryKey(parseInt(studentId || "0"), { academicYear: CURRENT_YEAR }) } }
  );

  const { data: palmares } = useGeneratePalmares(
    parseInt(classId || "0"),
    { academicYear: CURRENT_YEAR },
    { query: { enabled: mode === "palmares" && !!classId, queryKey: getGeneratePalmaresQueryKey(parseInt(classId || "0"), { academicYear: CURRENT_YEAR }) } }
  );

  const handlePrint = () => window.print();

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="no-print">
        <h1 className="text-xl sm:text-2xl font-bold">Generation de rapports PDF</h1>
        <p className="text-muted-foreground text-sm">Bulletins individuels et palmares de classe</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 no-print">
        <Button variant={mode === "bulletin" ? "default" : "outline"} onClick={() => setMode("bulletin")} className="w-full sm:w-auto">Bulletin individuel</Button>
        <Button variant={mode === "palmares" ? "default" : "outline"} onClick={() => setMode("palmares")} className="w-full sm:w-auto">Palmares de classe</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="no-print">
          <CardHeader><CardTitle className="text-sm">Parametres</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Classe</Label>
              <Select value={classId} onValueChange={(v) => { setClassId(v); setStudentId(""); }}>
                <SelectTrigger><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
                <SelectContent>
                  {(classes || []).map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {mode === "bulletin" && (
              <div className="space-y-1">
                <Label>Eleve</Label>
                <Select value={studentId} onValueChange={setStudentId} disabled={!classId}>
                  <SelectTrigger><SelectValue placeholder="Choisir un eleve" /></SelectTrigger>
                  <SelectContent>
                    {(students || []).map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.firstName} {s.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              onClick={handlePrint}
              disabled={mode === "bulletin" ? !bulletin : !palmares}
              className="w-full gap-2"
            >
              <Printer size={16} /> Imprimer / Exporter PDF
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {mode === "bulletin" && bulletin && (
            <div className="print-content">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="text-center border-b pb-4">
                    <p className="font-bold text-lg">{bulletin.schoolInfo?.name || "Institut Lwa-Nzururu"}</p>
                    <p className="text-sm text-muted-foreground">{bulletin.schoolInfo?.address}</p>
                    <h2 className="text-xl font-bold mt-2">BULLETIN ANNUEL</h2>
                    <p className="text-sm">Annee scolaire: {bulletin.academicYear}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Nom:</strong> {bulletin.student.lastName}</p>
                      <p><strong>Prenom:</strong> {bulletin.student.firstName}</p>
                      <p><strong>Sexe:</strong> {bulletin.student.gender === "M" ? "Masculin" : "Feminin"}</p>
                    </div>
                    <div>
                      <p><strong>Classe:</strong> {bulletin.className}</p>
                      <p><strong>No. matricule:</strong> {bulletin.student.registrationNumber}</p>
                      {bulletin.student.dateOfBirth && <p><strong>Date naiss.:</strong> {bulletin.student.dateOfBirth}</p>}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-2 py-1 text-left">Matiere</th>
                          <th className="border border-gray-300 px-1 py-1">Coeff</th>
                          {PERIODS.map(p => <th key={p} className="border border-gray-300 px-1 py-1">{PERIOD_LABELS[p]}</th>)}
                          <th className="border border-gray-300 px-1 py-1">Tot S1</th>
                          <th className="border border-gray-300 px-1 py-1">Tot S2</th>
                          <th className="border border-gray-300 px-1 py-1">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(bulletin.gradesBySubject || []).map((row: any) => (
                          <tr key={row.subjectId}>
                            <td className="border border-gray-300 px-2 py-1 font-medium">{row.subjectName}</td>
                            <td className="border border-gray-300 px-1 py-1 text-center">{row.coefficient}</td>
                            {PERIODS.map(p => (
                              <td key={p} className="border border-gray-300 px-1 py-1 text-center">
                                {row[p] != null ? row[p] : "-"}
                              </td>
                            ))}
                            <td className="border border-gray-300 px-1 py-1 text-center font-medium">{row.totalS1?.toFixed(0) || "-"}</td>
                            <td className="border border-gray-300 px-1 py-1 text-center font-medium">{row.totalS2?.toFixed(0) || "-"}</td>
                            <td className="border border-gray-300 px-1 py-1 text-center font-bold">{row.annualTotal?.toFixed(0) || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                    <div className="space-y-1">
                      <p><strong>Pourcentage:</strong> <span className={`font-bold ${bulletin.percentage >= 50 ? "text-green-600" : "text-red-600"}`}>{bulletin.percentage.toFixed(2)}%</span></p>
                      <p><strong>Classement:</strong> {bulletin.rank}e / {bulletin.totalStudentsInClass}</p>
                      <p><strong>Decision:</strong> <span className={`font-bold ${bulletin.passed ? "text-green-600" : "text-red-600"}`}>{bulletin.passed ? "ADMIS(E)" : "ECHOUE(E)"}</span></p>
                    </div>
                    <div className="text-right mt-4">
                      <p className="text-xs text-muted-foreground">{bulletin.signature?.location || "Beni"}, le _______________</p>
                      <p className="font-bold mt-4">{bulletin.signature?.provisioneurName}</p>
                      <p className="text-xs">{bulletin.signature?.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {mode === "palmares" && palmares && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="text-center border-b pb-4">
                  <p className="font-bold text-lg">{palmares.schoolInfo?.name}</p>
                  <h2 className="text-xl font-bold mt-2">PALMARES</h2>
                  <p className="text-sm">Classe: {palmares.className} - Annee {palmares.academicYear}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm text-center">
                  <div className="bg-muted rounded p-2"><p className="text-muted-foreground text-xs">Total</p><p className="font-bold">{palmares.stats.totalStudents}</p></div>
                  <div className="bg-muted rounded p-2"><p className="text-muted-foreground text-xs">Reussite</p><p className="font-bold text-green-600">{palmares.stats.passRate.toFixed(1)}%</p></div>
                  <div className="bg-muted rounded p-2"><p className="text-muted-foreground text-xs">Moyenne</p><p className="font-bold">{palmares.stats.averageScore.toFixed(1)}%</p></div>
                </div>
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-3 py-1">Rang</th>
                      <th className="border px-3 py-1 text-left">Nom</th>
                      <th className="border px-3 py-1">Sexe</th>
                      <th className="border px-3 py-1">Pts</th>
                      <th className="border px-3 py-1">%</th>
                      <th className="border px-3 py-1">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {palmares.rankings.map((r) => (
                      <tr key={r.studentId} className={r.passed ? "" : "bg-red-50"}>
                        <td className="border px-3 py-1 text-center font-bold">{r.rank}</td>
                        <td className="border px-3 py-1">{r.fullName}</td>
                        <td className="border px-3 py-1 text-center">{r.gender}</td>
                        <td className="border px-3 py-1 text-center">{r.totalPoints.toFixed(0)}</td>
                        <td className="border px-3 py-1 text-center font-bold">{r.percentage.toFixed(1)}%</td>
                        <td className={`border px-3 py-1 text-center font-bold ${r.passed ? "text-green-600" : "text-red-600"}`}>
                          {r.passed ? "Admis" : "Echoue"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-right mt-4 text-sm">
                  <p className="text-muted-foreground">{palmares.signature?.location || "Beni"}, le _______________</p>
                  <p className="font-bold mt-8">{palmares.signature?.provisioneurName}</p>
                  <p className="text-xs">{palmares.signature?.title}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!bulletin && !palmares && (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Selectionnez {mode === "bulletin" ? "un eleve" : "une classe"} pour generer le rapport</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-content { display: block; }
          body { font-size: 12px; }
        }
      `}</style>
    </div>
  );
}
