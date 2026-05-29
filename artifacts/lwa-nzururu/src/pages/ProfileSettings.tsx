import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfileSettings() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();

  const [nameForm, setNameForm] = useState({ fullName: user?.fullName || "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [nameSuccess, setNameSuccess] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [nameError, setNameError] = useState("");
  const [pwError, setPwError] = useState("");

  const updateMutation = useUpdateProfile({
    mutation: {
      onSuccess: (updatedUser) => {
        setUser(updatedUser as any);
        queryClient.invalidateQueries();
      },
    },
  });

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setNameSuccess(false);
    updateMutation.mutate(
      { data: { fullName: nameForm.fullName } },
      {
        onSuccess: () => { setNameSuccess(true); setTimeout(() => setNameSuccess(false), 3000); },
        onError: (err: any) => setNameError(err?.data?.error || "Erreur lors de la mise a jour"),
      }
    );
  };

  const handlePwSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("Les mots de passe ne correspondent pas");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError("Le mot de passe doit faire au moins 6 caracteres");
      return;
    }
    updateMutation.mutate(
      { data: { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword } },
      {
        onSuccess: () => {
          setPwSuccess(true);
          setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
          setTimeout(() => setPwSuccess(false), 3000);
        },
        onError: (err: any) => setPwError(err?.data?.error || "Erreur lors du changement"),
      }
    );
  };

  const roleLabels: Record<string, string> = {
    proviseur: "Proviseur",
    enseignant: "Enseignant",
    titulaire: "Titulaire de classe",
    secretaire: "Secretaire",
    parent: "Parent d'eleve",
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Mon profil</h1>
        <p className="text-muted-foreground text-sm">
          {user?.username} · {user?.role ? roleLabels[user.role] : ""}
          {user?.className ? ` · ${user.className}` : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Nom complet</Label>
              <Input
                value={nameForm.fullName}
                onChange={(e) => setNameForm({ fullName: e.target.value })}
                required
              />
            </div>
            {nameError && <p className="text-destructive text-sm">{nameError}</p>}
            {nameSuccess && <p className="text-green-600 text-sm">Nom mis a jour avec succes.</p>}
            <Button type="submit" disabled={updateMutation.isPending}>
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Changer le mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePwSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Mot de passe actuel</Label>
              <Input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Nouveau mot de passe</Label>
              <Input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Confirmer le nouveau mot de passe</Label>
              <Input
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                required
              />
            </div>
            {pwError && <p className="text-destructive text-sm">{pwError}</p>}
            {pwSuccess && <p className="text-green-600 text-sm">Mot de passe modifie avec succes.</p>}
            <Button type="submit" disabled={updateMutation.isPending}>
              Changer le mot de passe
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
