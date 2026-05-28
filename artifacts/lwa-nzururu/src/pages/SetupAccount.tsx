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
  const [tempUsername, setTempUsername] = useState(user?.username || "");
  const [tempPassword, setTempPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [error, setError] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setupMutation.mutate({
      data: { tempUsername, tempPassword, newUsername, newPassword, fullName },
    });
  };

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
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>

              {error && <div className="text-destructive text-sm">{error}</div>}

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
