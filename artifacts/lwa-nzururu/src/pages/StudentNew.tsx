import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateStudent, useListClasses, getListStudentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CURRENT_YEAR = "2024-2025";

export default function StudentNew() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: classes } = useListClasses();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "M",
    dateOfBirth: "",
    placeOfBirth: "",
    fatherName: "",
    motherName: "",
    address: "",
    classId: "",
  });
  const [error, setError] = useState("");

  const createMutation = useCreateStudent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
        navigate("/students");
      },
      onError: (err: any) => setError(err?.data?.error || "Erreur lors de l'inscription"),
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.classId) { setError("Veuillez choisir une classe"); return; }
    createMutation.mutate({
      data: {
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender as "M" | "F",
        dateOfBirth: form.dateOfBirth || undefined,
        placeOfBirth: form.placeOfBirth || undefined,
        fatherName: form.fatherName || undefined,
        motherName: form.motherName || undefined,
        address: form.address || undefined,
        classId: parseInt(form.classId),
        academicYear: CURRENT_YEAR,
      },
    });
  };

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/students")} className="p-1.5 rounded hover:bg-muted">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">Inscrire un eleve</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">Informations personnelles (Fiche A)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Prenom *</Label>
                <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Nom *</Label>
                <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Sexe *</Label>
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Feminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Date de naissance</Label>
                <Input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Lieu de naissance</Label>
              <Input value={form.placeOfBirth} onChange={(e) => set("placeOfBirth", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nom du pere</Label>
                <Input value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Nom de la mere</Label>
                <Input value={form.motherName} onChange={(e) => set("motherName", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Adresse</Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Affectation scolaire (Fiche B)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Classe *</Label>
              <Select value={form.classId} onValueChange={(v) => set("classId", v)}>
                <SelectTrigger><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
                <SelectContent>
                  {(classes || []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Annee academique</Label>
              <Input value={CURRENT_YEAR} disabled className="bg-muted" />
            </div>
          </CardContent>
        </Card>

        {error && <div className="text-destructive text-sm mt-3">{error}</div>}

        <div className="flex gap-3 mt-4">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Inscription..." : "Inscrire l'eleve"}
          </Button>
          <Button variant="outline" type="button" onClick={() => navigate("/students")}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
