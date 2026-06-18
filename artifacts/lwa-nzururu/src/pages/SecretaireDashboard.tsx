import { Link } from "wouter";
import { useListStudents, useListClasses, getListStudentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Plus } from "lucide-react";

const CURRENT_YEAR = "2024-2025";

export default function SecretaireDashboard() {
  const { data: classes } = useListClasses();
  const { data: students } = useListStudents(
    { academicYear: CURRENT_YEAR },
    { query: { queryKey: getListStudentsQueryKey({ academicYear: CURRENT_YEAR }) } }
  );

  const male = (students || []).filter((s) => s.gender === "M").length;
  const female = (students || []).filter((s) => s.gender === "F").length;

  const byClass = (classes || []).map((c) => ({
    ...c,
    count: (students || []).filter((s) => s.classId === c.id).length,
  }));

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Tableau de bord — Secretaire</h1>
          <p className="text-muted-foreground text-sm">Annee scolaire {CURRENT_YEAR}</p>
        </div>
        <Link href="/students/new">
          <Button size="sm" className="gap-1.5">
            <Plus size={14} /> Inscrire un eleve
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-primary">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total eleves</p>
              <p className="text-3xl font-bold">{students?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-blue-600">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Garcons</p>
              <p className="text-3xl font-bold">{male}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-red-600">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Filles</p>
              <p className="text-3xl font-bold">{female}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Effectifs par classe</span>
            <Link href="/students">
              <Button size="sm" variant="outline">Voir tous les eleves</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {byClass.map((c) => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-muted-foreground" />
                  <span className="font-medium text-sm">{c.name}</span>
                </div>
                <span className="font-bold text-sm">{c.count} eleve(s)</span>
              </div>
            ))}
            {byClass.length === 0 && (
              <p className="px-5 py-4 text-sm text-muted-foreground">Aucune classe enregistree.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
