import { useState, useEffect } from "react";
import { useGetSignatureInfo, getGetSignatureInfoQueryKey, useUpdateSignatureInfo } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChangePassword } from "@workspace/api-client-react";

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: sig } = useGetSignatureInfo({ query: { queryKey: getGetSignatureInfoQueryKey() } });

  const [sigForm, setSigForm] = useState({ provisioneurName: "", title: "Proviseur", location: "", schoolName: "Institut Lwa-Nzururu" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [sigSuccess, setSigSuccess] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (sig) {
      setSigForm({
        provisioneurName: sig.provisioneurName || "",
        title: sig.title || "Proviseur",
        location: sig.location || "",
        schoolName: sig.schoolName || "Institut Lwa-Nzururu",
      });
    }
  }, [sig]);

  const updateSigMutation = useUpdateSignatureInfo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSignatureInfoQueryKey() });
        setSigSuccess(true);
        setTimeout(() => setSigSuccess(false), 3000);
      },
    },
  });

  const changePwMutation = useChangePassword({
    mutation: {
      onSuccess: () => {
        setPwSuccess(true);
        setPwForm({ currentPassword: "", newPassword: "" });
        setTimeout(() => setPwSuccess(false), 3000);
      },
      onError: (err: any) => setPwError(err?.data?.error || "Erreur"),
    },
  });

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold">Parametres</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Signature du Proviseur (PDF)</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); updateSigMutation.mutate({ data: sigForm }); }} className="space-y-4">
            <div className="space-y-1">
              <Label>Nom du Proviseur *</Label>
              <Input value={sigForm.provisioneurName} onChange={(e) => setSigForm({ ...sigForm, provisioneurName: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Titre *</Label>
                <Input value={sigForm.title} onChange={(e) => setSigForm({ ...sigForm, title: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Lieu</Label>
                <Input value={sigForm.location} onChange={(e) => setSigForm({ ...sigForm, location: e.target.value })} placeholder="Beni" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Nom de l'ecole *</Label>
              <Input value={sigForm.schoolName} onChange={(e) => setSigForm({ ...sigForm, schoolName: e.target.value })} required />
            </div>
            {sigSuccess && <div className="text-green-600 text-sm">Signature mise a jour</div>}
            <Button type="submit" disabled={updateSigMutation.isPending}>
              {updateSigMutation.isPending ? "Enregistrement..." : "Enregistrer la signature"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Changer mon mot de passe</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); setPwError(""); changePwMutation.mutate({ data: pwForm }); }} className="space-y-4">
            <div className="space-y-1">
              <Label>Mot de passe actuel *</Label>
              <Input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Nouveau mot de passe *</Label>
              <Input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
            </div>
            {pwError && <div className="text-destructive text-sm">{pwError}</div>}
            {pwSuccess && <div className="text-green-600 text-sm">Mot de passe modifie</div>}
            <Button type="submit" disabled={changePwMutation.isPending}>
              {changePwMutation.isPending ? "Modification..." : "Changer le mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
