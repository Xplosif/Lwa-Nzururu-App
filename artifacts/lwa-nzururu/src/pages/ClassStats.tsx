import { useRoute } from "wouter";
import { useGetClassStats, getGetClassStatsQueryKey } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const CURRENT_YEAR = "2024-2025";

export default function ClassStats() {
  const [, params] = useRoute("/stats/:classId");
  const classId = parseInt(params?.classId || "0");

  const { data: stats, isLoading } = useGetClassStats(
    classId,
    { academicYear: CURRENT_YEAR },
    { query: { enabled: !!classId, queryKey: getGetClassStatsQueryKey(classId, { academicYear: CURRENT_YEAR }) } }
  );

  if (isLoading) {
    return <div className="p-8 flex justify-center text-muted-foreground">Chargement...</div>;
  }

  if (!stats) {
    return <div className="p-8 text-muted-foreground">Classe introuvable</div>;
  }

  const subjectBarData = stats.subjectAverages.map((s) => ({
    name: s.subjectName.substring(0, 10),
    Moyenne: s.average.toFixed(1),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/">
          <button className="p-1.5 rounded hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{stats.className}</h1>
          <p className="text-muted-foreground text-sm">Annee {stats.academicYear}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground text-xs">Total eleves</p><p className="text-3xl font-bold">{stats.totalStudents}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground text-xs">Garcons</p><p className="text-3xl font-bold text-primary">{stats.maleStudents}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground text-xs">Filles</p><p className="text-3xl font-bold text-destructive">{stats.femaleStudents}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground text-xs">Taux reussite</p><p className={`text-3xl font-bold ${stats.passRate >= 50 ? "text-green-600" : "text-destructive"}`}>{stats.passRate.toFixed(0)}%</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
        <Card><CardContent className="p-4"><p className="text-muted-foreground text-xs mb-1">Reussite Garcons</p><p className="text-xl font-bold">{stats.malePassRate.toFixed(1)}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-muted-foreground text-xs mb-1">Reussite Filles</p><p className="text-xl font-bold">{stats.femalePassRate.toFixed(1)}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-muted-foreground text-xs mb-1">Moyenne generale</p><p className="text-xl font-bold">{stats.averageScore.toFixed(1)}%</p></CardContent></Card>
      </div>

      {subjectBarData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Moyennes par matiere</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={subjectBarData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Moyenne" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Classement des eleves</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="px-5 py-2 grid grid-cols-12 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="col-span-1">#</span>
              <span className="col-span-5">Nom</span>
              <span className="col-span-2 text-center">Sexe</span>
              <span className="col-span-2 text-right">Points</span>
              <span className="col-span-2 text-right">%</span>
            </div>
            {stats.studentRankings.map((s) => (
              <div key={s.studentId} className="px-5 py-2.5 grid grid-cols-12 text-sm items-center">
                <span className="col-span-1 text-muted-foreground font-bold">{s.rank}</span>
                <span className="col-span-5 font-medium truncate">{s.fullName}</span>
                <span className="col-span-2 text-center">
                  <Badge variant={s.gender === "M" ? "default" : "destructive"} className="text-xs px-1.5">
                    {s.gender === "M" ? "G" : "F"}
                  </Badge>
                </span>
                <span className="col-span-2 text-right text-muted-foreground">{s.totalPoints.toFixed(0)}</span>
                <span className={`col-span-2 text-right font-bold ${s.passed ? "text-green-600" : "text-destructive"}`}>
                  {s.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
            {stats.studentRankings.length === 0 && (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                Aucune note enregistree
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
