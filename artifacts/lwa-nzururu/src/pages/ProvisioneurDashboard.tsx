import { useState } from "react";
import { useGetDashboardStats, useListClasses, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, GraduationCap, TrendingUp, BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CURRENT_YEAR = "2024-2025";

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string | number; subtitle?: string; icon: any; color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon size={22} className="text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [year] = useState(CURRENT_YEAR);
  const { data: stats, isLoading } = useGetDashboardStats({ academicYear: year });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-muted-foreground">Chargement des statistiques...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Aucune donnee disponible pour {year}.</p>
      </div>
    );
  }

  const genderPieData = [
    { name: "Garcons", value: stats.maleStudents, color: "#1e3a8a" },
    { name: "Filles", value: stats.femaleStudents, color: "#dc2626" },
  ];

  const passRatePieData = [
    { name: "Admis", value: Math.round(stats.overallPassRate), color: "#16a34a" },
    { name: "Echoues", value: Math.round(100 - stats.overallPassRate), color: "#dc2626" },
  ];

  const classBarData = stats.classStats.map((c) => ({
    name: c.className.replace("eme", "e").substring(0, 8),
    "Taux": Math.round(c.passRate),
    "Garcons": Math.round(c.malePassRate),
    "Filles": Math.round(c.femalePassRate),
  }));

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">Annee scolaire {year}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Total Eleves" value={stats.totalStudents} icon={GraduationCap} color="bg-primary" />
        <StatCard title="Classes" value={stats.totalClasses} icon={BookOpen} color="bg-blue-600" />
        <StatCard title="Personnel" value={stats.totalTeachers} icon={Users} color="bg-amber-600" />
        <StatCard
          title="Taux de Reussite"
          value={`${stats.overallPassRate.toFixed(1)}%`}
          icon={TrendingUp}
          color={stats.overallPassRate >= 50 ? "bg-green-600" : "bg-destructive"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Taux de reussite par classe</CardTitle>
          </CardHeader>
          <CardContent>
            {classBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={classBarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val: number) => `${val}%`} />
                  <Legend />
                  <Bar dataKey="Taux" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Garcons" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Filles" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Aucune note enregistree pour cette annee
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Repartition par sexe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                {stats.totalStudents > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie data={genderPieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                          {genderPieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 text-xs mt-1">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span>Garcons: <strong>{stats.maleStudents}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-destructive" />
                        <span>Filles: <strong>{stats.femaleStudents}</strong></span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-[120px] flex items-center text-muted-foreground text-xs">Aucun eleve</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Reussite par sexe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Garcons</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${stats.malePassRate}%` }} />
                  </div>
                  <span className="font-medium text-xs w-10 text-right">{stats.malePassRate.toFixed(0)}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Filles</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-destructive rounded-full" style={{ width: `${stats.femalePassRate}%` }} />
                  </div>
                  <span className="font-medium text-xs w-10 text-right">{stats.femalePassRate.toFixed(0)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.classStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance par classe</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {stats.classStats.map((cls) => (
                  <Link key={cls.classId} href={`/stats/${cls.classId}`}>
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors">
                      <div>
                        <p className="font-medium text-sm">{cls.className}</p>
                        <p className="text-xs text-muted-foreground">{cls.totalStudents} eleves · Moy. {cls.averageScore.toFixed(1)}%</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`font-bold text-sm ${cls.passRate >= 50 ? "text-green-600" : "text-destructive"}`}>
                            {cls.passRate.toFixed(0)}%
                          </p>
                          <p className="text-xs text-muted-foreground">reussite</p>
                        </div>
                        <ArrowRight size={14} className="text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {stats.topStudents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meilleurs eleves</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {stats.topStudents.slice(0, 8).map((s) => (
                  <div key={s.studentId} className="px-5 py-2.5 flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">{s.rank}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.fullName}</p>
                      <p className="text-xs text-muted-foreground">{s.className}</p>
                    </div>
                    <span className="font-bold text-sm text-green-600">{s.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
