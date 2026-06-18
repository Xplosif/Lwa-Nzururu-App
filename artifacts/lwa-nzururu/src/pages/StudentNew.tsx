import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateStudent, useListClasses, getListStudentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const CURRENT_YEAR = "2024-2025";
const BULLETINS_OPTIONS = [
  { value: "1ere", label: "1re annee" },
  { value: "2eme", label: "2e annee" },
  { value: "3eme", label: "3e annee" },
  { value: "5eme", label: "5e annee" },
  { value: "6eme", label: "6e annee" },
];

type ParentCreds = { username: string; password: string };

export default function StudentNew() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: classes } = useListClasses();

  const [form, setForm] = useState({
    lastName: "",
    postnom: "",
    firstName: "",
    gender: "M",
    dateOfBirth: "",
    placeOfBirth: "",
    fatherName: "",
    motherName: "",
    fonction: "",
    phoneNumber: "",
    address: "",
    confession: "",
    ecoleProvenance: "",
    bulletinsPresentes: [] as string[],
    pourcentagePrecedent: "",
    classId: "",
  });
  const [error, setError] = useState("");
  const [parentCreds, setParentCreds] = useState<ParentCreds | null>(null);
  const [copied, setCopied] = useState(false);

  const createMutation = useCreateStudent({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
        if (data.parentCredentials) {
          setParentCreds(data.parentCredentials);
        } else {
          navigate("/students");
        }
      },
      onError: (err: any) => setError(err?.data?.error || "Erreur lors de l'inscription"),
    },
  });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const toggleBulletin = (val: string) => {
    setForm((f) => ({
      ...f,
      bulletinsPresentes: f.bulletinsPresentes.includes(val)
        ? f.bulletinsPresentes.filter((b) => b !== val)
        : [...f.bulletinsPresentes, val],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.classId) { setError("Veuillez choisir une classe"); return; }
    createMutation.mutate({
      data: {
        lastName: form.lastName,
        postnom: form.postnom || undefined,
        firstName: form.firstName,
        gender: form.gender as "M" | "F",
        dateOfBirth: form.dateOfBirth || undefined,
        placeOfBirth: form.placeOfBirth || undefined,
        fatherName: form.fatherName || undefined,
        motherName: form.motherName || undefined,
        fonction: form.fonction || undefined,
        phoneNumber: form.phoneNumber || undefined,
        address: form.address || undefined,
        confession: form.confession || undefined,
        ecoleProvenance: form.ecoleProvenance || undefined,
        bulletinsPresentes: form.bulletinsPresentes.length > 0 ? form.bulletinsPresentes : undefined,
        pourcentagePrecedent: form.pourcentagePrecedent ? parseFloat(form.pourcentagePrecedent) : undefined,
        classId: parseInt(form.classId),
        academicYear: CURRENT_YEAR,
      },
    });
  };

  const copyToClipboard = () => {
    if (!parentCreds) return;
    navigator.clipboard.writeText(`Identifiant: ${parentCreds.username}\nMot de passe: ${parentCreds.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (parentCreds) {
    return (
      <div className="p-4 sm:p-6 max-w-lg">
        <h1 className="text-xl font-bold mb-4">Inscription reussie</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-green-700">Compte parent cree automatiquement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Remettez ces identifiants temporaires au parent. Il devra les modifier lors de sa premiere connexion.
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-1">
              <div>Identifiant: <strong>{parentCreds.username}</strong></div>
              <div>Mot de passe: <strong>{parentCreds.password}</strong></div>
            </div>
            <Button variant="outline" onClick={copyToClipboard} className="w-full gap-2">
              {copied ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} />}
              {copied ? "Copie!" : "Copier les identifiants"}
            </Button>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/students")} className="flex-1">Terminer</Button>
              <Button variant="outline" onClick={() => { setParentCreds(null); setForm({ lastName: "", postnom: "", firstName: "", gender: "M", dateOfBirth: "", placeOfBirth: "", fatherName: "", motherName: "", fonction: "", phoneNumber: "", address: "", confession: "", ecoleProvenance: "", bulletinsPresentes: [], pourcentagePrecedent: "", classId: "" }); }} className="flex-1">
                Inscrire un autre
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/students")} className="p-1.5 rounded hover:bg-muted flex-shrink-0">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold">Inscrire un eleve</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Identite de l'eleve (Fiche A)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Nom *</Label>
              <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Postnom</Label>
              <Input value={form.postnom} onChange={(e) => set("postnom", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Prenom *</Label>
              <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Pere</Label>
                <Input value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Mere</Label>
                <Input value={form.motherName} onChange={(e) => set("motherName", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Fonction (profession)</Label>
              <Input value={form.fonction} onChange={(e) => set("fonction", e.target.value)} placeholder="Ex: Commercant, Fonctionnaire..." />
            </div>

            <div className="space-y-1">
              <Label>Numero de telephone</Label>
              <Input value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} placeholder="Ex: +243 81 234 5678" type="tel" />
            </div>

            <div className="space-y-1">
              <Label>Adresse</Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Confession religieuse</Label>
              <Input value={form.confession} onChange={(e) => set("confession", e.target.value)} placeholder="Ex: Catholique, Protestant..." />
            </div>

            <div className="space-y-1">
              <Label>Ecole de provenance</Label>
              <Input value={form.ecoleProvenance} onChange={(e) => set("ecoleProvenance", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Dossier scolaire anterieur</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Bulletins presentes</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BULLETINS_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`bulletin-${opt.value}`}
                      checked={form.bulletinsPresentes.includes(opt.value)}
                      onCheckedChange={() => toggleBulletin(opt.value)}
                    />
                    <label htmlFor={`bulletin-${opt.value}`} className="text-sm cursor-pointer">
                      {opt.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Pourcentage precedent (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.pourcentagePrecedent}
                onChange={(e) => set("pourcentagePrecedent", e.target.value)}
                placeholder="Ex: 67.5"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Affectation (Fiche B)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Classe sollicitee *</Label>
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
              <Label>Annee scolaire</Label>
              <Input value={CURRENT_YEAR} disabled className="bg-muted" />
            </div>
          </CardContent>
        </Card>

        {error && <div className="text-destructive text-sm">{error}</div>}

        <div className="flex gap-3">
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
