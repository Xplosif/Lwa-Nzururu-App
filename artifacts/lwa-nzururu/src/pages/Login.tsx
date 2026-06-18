import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        const u = data.user as any;
        setUser(u);
        queryClient.invalidateQueries();
        if (data.requiresSetup) {
          navigate("/setup-account");
        } else if (u?.role === "parent") {
          navigate("/bulletin");
        } else {
          navigate("/");
        }
      },
      onError: (err: any) => {
        setError(err?.data?.error || "Identifiant ou mot de passe incorrect");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ data: { username, password } });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">L</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Institut Lwa-Nzururu</h1>
          <p className="text-muted-foreground text-sm mt-1">Beni, Nord-Kivu, RDC</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connexion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Identifiant</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Votre identifiant"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  required
                />
              </div>

              {error && (
                <div className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-4 p-3 bg-muted rounded-md text-xs text-muted-foreground">
              <strong>Compte demo:</strong><br />
              Proviseur: <code>proviseur</code> / <code>admin123</code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
