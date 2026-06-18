import { useState } from "react";
import { useLocation } from "wouter";
import { useSetupAccount } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SetupAccount() {
  const [, navigate] = useLocation();
  const { user, setUser } = useAuth();
  const isAuthenticated = !!user;

  const [tempUsername, setTempUsername] = useState(user?.username || "");
  const [tempPassword, setTempPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const setupMutation = useSetupAccount({
    mutation: {
      onSuccess: (data) => {
        const u = data.user as any;
        setUser(u);
        navigate(u?.role === "parent" ? "/bulletin" : "/");
      },
      onError: (err: any) => {
        setError(err?.data?.error || "Erreur lors de la configuration");
      },
    },
  });

  const handleSubmitUnauthenticated = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) { setError("Les mots de passe ne correspondent pas"); return; }
    if (newPassword.length < 6) { setError("Le mot de passe doit faire au moins 6 caracteres"); return; }
    setupMutation.mutate({
      data: { tempUsername, tempPassword, newUsername, newPassword, fullName },
    });
  };

  const handleSubmitAuthenticated = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) { setError("Les mots de passe ne correspondent pas"); return; }
    if (newPassword.length < 6) { setError("Le mot de passe doit faire au moins 6 caracteres"); return; }
    if (!newUsername.trim()) { setError("L'identifiant est requis"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fullName, newUsername, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); setLoading(false); return; }
      setUser({ ...data, isFirstLogin: false });
      navigate(data.role === "parent" ? "/bulletin" : "/");
    } catch {
      setError("Erreur reseau");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Personnalisez votre compte</CardTitle>
              <CardDescription>
                Premiere connexion — choisissez votre identifiant et mot de passe personnels avant de continuer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitAuthenticated} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom complet</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Nouvel identifiant</Label>
                  <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Choisissez un identifiant" required />
                </div>
                <div className="space-y-2">
                  <Label>Nouveau mot de passe</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Au moins 6 caracteres" required />
                </div>
                <div className="space-y-2">
                  <Label>Confirmer le mot de passe</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repetez le mot de passe" required />
                </div>
                {error && <div className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-md">{error}</div>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enregistrement..." : "Confirmer et continuer"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Personnalisez votre compte</CardTitle>
            <CardDescription>
              Premiere connexion: choisissez votre identifiant et mot de passe definitifs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitUnauthenticated} className="space-y-4">
              <div className="space-y-2">
                <Label>Identifiant temporaire</Label>
                <Input value={tempUsername} onChange={(e) => setTempUsername(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe temporaire</Label>
                <Input type="password" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} required />
              </div>
              <hr className="my-2" />
              <div className="space-y-2">
                <Label>Votre nom complet</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Nouvel identifiant</Label>
                <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Choisissez un identifiant" required />
              </div>
              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Au moins 6 caracteres" required />
              </div>
              <div className="space-y-2">
                <Label>Confirmer le mot de passe</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repetez le mot de passe" required />
              </div>
              {error && <div className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-md">{error}</div>}
              <Button type="submit" className="w-full" disabled={setupMutation.isPending}>
                {setupMutation.isPending ? "Configuration..." : "Confirmer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
