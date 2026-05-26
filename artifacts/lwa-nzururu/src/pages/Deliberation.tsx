import { useState } from "react";
import {
  useListClasses,
  useListDeliberations,
  useCreateDeliberation,
  useGetDeliberation,
  useApproveDeliberation,
  useSetDeliberationBonus,
  getListDeliberationsQueryKey,
  getGetDeliberationQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const CURRENT_YEAR = "2024-2025";

const SEMESTER_LABELS: Record<string, string> = {
  S1: "1er semestre (P1 + P2 + Exam S1)",
  S2: "2e semestre (P3 + P4 + Exam S2)",
};

const STATUS_LABELS: Record<string, string> = {
  brouillon: "En cours",
  approuve: "Approuve",
};

export default function Deliberation() {
  const { user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<"S1" | "S2">("S1");
  const [openDeliberationId, setOpenDeliberationId] = useState<number | null>(null);
  const [bonusInputs, setBonusInputs] = useState<Record<number, string>>({});

  const { data: classes } = useListClasses();
  const deliberationsParams = { classId: selectedClassId || undefined, academicYear: CURRENT_YEAR };
  const { data: deliberations, refetch: refetchList } = useListDeliberations(deliberationsParams, {
    query: { enabled: !!selectedClassId, queryKey: getListDeliberationsQueryKey(deliberationsParams) },
  });

  const { data: deliberationDetail, refetch: refetchDetail } = useGetDeliberation(
    openDeliberationId!,
    { query: { enabled: openDeliberationId !== null, queryKey: getGetDeliberationQueryKey(openDeliberationId!) } }
  );

  const createDelib = useCreateDeliberation();
  const approveDelib = useApproveDeliberation();
  const setBonus = useSetDeliberationBonus();

  if (user?.role !== "proviseur") {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Acces reserve au Proviseur.</p>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!selectedClassId) return;
    await createDelib.mutateAsync({
      data: { classId: selectedClassId, academicYear: CURRENT_YEAR, semester: selectedSemester },
    });
    refetchList();
  };

  const handleApprove = async (id: number) => {
    if (!confirm("Approuver cette deliberation ? Les parents pourront consulter les resultats.")) return;
    await approveDelib.mutateAsync({ id });
    refetchList();
    if (openDeliberationId === id) refetchDetail();
  };

  const handleBonusChange = (studentId: number, value: string) => {
    setBonusInputs((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleBonusSave = async (deliberationId: number, studentId: number) => {
    const val = parseFloat(bonusInputs[studentId] ?? "0");
    if (isNaN(val) || val < 0) return;
    await setBonus.mutateAsync({ id: deliberationId, data: { studentId, bonusPoints: val } });
    refetchDetail();
  };

  const openDelib = deliberations?.find((d) => d.id === openDeliberationId);
  const isApproved = openDelib?.status === "approuve";

  const initBonus = (studentId: number, current: number) => {
    if (bonusInputs[studentId] === undefined) {
      setBonusInputs((prev) => ({ ...prev, [studentId]: String(current) }));
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">Deliberation</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ouvrir ou creer une deliberation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-sm font-medium">Classe</label>
            <Select
              value={selectedClassId?.toString() || ""}
              onValueChange={(v) => { setSelectedClassId(Number(v)); setOpenDeliberationId(null); }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Choisir une classe" />
              </SelectTrigger>
              <SelectContent>
                {(classes || []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Semestre</label>
            <Select value={selectedSemester} onValueChange={(v) => setSelectedSemester(v as "S1" | "S2")}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="S1">1er semestre (S1)</SelectItem>
                <SelectItem value="S2">2e semestre (S2)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!selectedClassId || createDelib.isPending}
          >
            Creer la deliberation
          </Button>
        </CardContent>
      </Card>

      {selectedClassId && deliberations && deliberations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deliberations existantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {deliberations.map((d) => (
              <div key={d.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <span className="font-medium">{d.className}</span>
                  <span className="text-muted-foreground ml-2">— {SEMESTER_LABELS[d.semester] || d.semester}</span>
                  <span className="ml-2 text-sm text-muted-foreground">{d.academicYear}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={d.status === "approuve" ? "default" : "secondary"}>
                    {STATUS_LABELS[d.status] || d.status}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => setOpenDeliberationId(d.id)}>
                    Ouvrir
                  </Button>
                  {d.status === "brouillon" && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(d.id)}
                      disabled={approveDelib.isPending}
                    >
                      Approuver
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {openDeliberationId !== null && deliberationDetail && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-3">
              {deliberationDetail.deliberation.className} — {SEMESTER_LABELS[deliberationDetail.deliberation.semester] || deliberationDetail.deliberation.semester}
              <Badge variant={isApproved ? "default" : "secondary"}>
                {STATUS_LABELS[deliberationDetail.deliberation.status] || deliberationDetail.deliberation.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isApproved && (
              <p className="text-sm text-green-700 mb-4 font-medium">
                Cette deliberation a ete approuvee le {new Date(deliberationDetail.deliberation.approvedAt!).toLocaleDateString("fr-FR")}. Les parents peuvent consulter les resultats.
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium">Rang</th>
                    <th className="text-left p-2 font-medium">Eleve</th>
                    <th className="text-center p-2 font-medium">Genre</th>
                    <th className="text-right p-2 font-medium">Total sem.</th>
                    <th className="text-right p-2 font-medium">%</th>
                    <th className="text-center p-2 font-medium">Resultat</th>
                    <th className="text-center p-2 font-medium">Points bonus</th>
                    {!isApproved && <th className="text-center p-2 font-medium">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {deliberationDetail.students.map((s, idx) => {
                    initBonus(s.studentId, s.bonusPoints);
                    return (
                      <tr key={s.studentId} className="border-b hover:bg-muted/30">
                        <td className="p-2 text-center font-mono text-muted-foreground">{idx + 1}</td>
                        <td className="p-2">
                          <div className="font-medium">{s.fullName}</div>
                          <div className="text-xs text-muted-foreground">{s.registrationNumber}</div>
                        </td>
                        <td className="p-2 text-center text-muted-foreground">{s.gender}</td>
                        <td className="p-2 text-right font-mono">
                          {s.semesterTotal != null && s.semesterMax != null
                            ? `${s.semesterTotal.toFixed(1)} / ${s.semesterMax.toFixed(0)}`
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="p-2 text-right font-mono">
                          {s.percentage != null ? `${s.percentage.toFixed(1)}%` : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="p-2 text-center">
                          {s.percentage != null ? (
                            <Badge variant={s.passed ? "default" : "destructive"}>
                              {s.passed ? "Admis" : "Echoue"}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Notes incompletes</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {isApproved ? (
                            <span className="font-mono">{s.bonusPoints}</span>
                          ) : (
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              className="w-20 text-center mx-auto"
                              value={bonusInputs[s.studentId] ?? String(s.bonusPoints)}
                              onChange={(e) => handleBonusChange(s.studentId, e.target.value)}
                            />
                          )}
                        </td>
                        {!isApproved && (
                          <td className="p-2 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBonusSave(openDeliberationId, s.studentId)}
                              disabled={setBonus.isPending}
                            >
                              Enregistrer
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!isApproved && deliberationDetail.students.length > 0 && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => handleApprove(openDeliberationId)}
                  disabled={approveDelib.isPending}
                >
                  Approuver la deliberation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
