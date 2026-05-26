import { useState } from "react";
import { Link } from "wouter";
import {
  useListStudents,
  getListStudentsQueryKey,
  useDeleteStudent,
  useListClasses,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

const CURRENT_YEAR = "2024-2025";

export default function Students() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const classQuery = classFilter !== "all" ? { classId: parseInt(classFilter), academicYear: CURRENT_YEAR } : { academicYear: CURRENT_YEAR };
  const { data: students, isLoading } = useListStudents(classQuery, {
    query: { queryKey: getListStudentsQueryKey(classQuery) },
  });

  const { data: classes } = useListClasses();
  const deleteMutation = useDeleteStudent({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() }),
    },
  });

  const filtered = (students || []).filter(
    (s) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      s.registrationNumber.toLowerCase().includes(search.toLowerCase())
  );

  const canManage = user?.role === "secretaire";

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Eleves</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} eleve(s)</p>
        </div>
        {canManage && (
          <Link href="/students/new">
            <Button size="sm" className="gap-1.5 w-full sm:w-auto">
              <Plus size={16} /> Inscrire un eleve
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou numero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Toutes les classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            {(classes || []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="hidden md:grid px-5 py-2 grid-cols-12 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="col-span-1">No.</span>
              <span className="col-span-4">Nom complet</span>
              <span className="col-span-2 text-center">Sexe</span>
              <span className="col-span-3">Classe</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>
            {isLoading && (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">Chargement...</div>
            )}
            {!isLoading && filtered.length === 0 && (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                Aucun eleve trouve
              </div>
            )}
            {filtered.map((s) => (
              <div key={s.id} className="px-4 sm:px-5 py-3 flex flex-col gap-2 md:grid md:grid-cols-12 md:gap-0 text-sm md:items-center hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between md:contents">
                  <span className="md:col-span-1 text-xs text-muted-foreground">{s.registrationNumber}</span>
                  <span className="md:col-span-4 font-medium">{s.firstName} {s.lastName}</span>
                </div>
                <div className="flex items-center justify-between md:contents">
                  <Badge variant={s.gender === "M" ? "default" : "destructive"} className="text-xs md:col-span-2 md:justify-self-center w-fit">
                    {s.gender === "M" ? "Garcon" : "Fille"}
                  </Badge>
                  <span className="md:col-span-3 text-muted-foreground text-xs md:text-sm">{s.className}</span>
                </div>
                <div className="md:col-span-2 flex justify-end gap-1 pt-1 md:pt-0 border-t md:border-t-0 border-border/60">
                  <Link href={`/students/${s.id}`}>
                    <button className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors">
                      <Eye size={15} />
                    </button>
                  </Link>
                  {canManage && (
                    <button
                      className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
                      onClick={() => {
                        if (confirm("Supprimer cet eleve?")) deleteMutation.mutate({ id: s.id });
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
