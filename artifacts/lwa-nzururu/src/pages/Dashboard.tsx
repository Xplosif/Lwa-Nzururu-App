import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import EnseignantDashboard from "./EnseignantDashboard";
import TitulaireDashboard from "./TitulaireDashboard";
import SecretaireDashboard from "./SecretaireDashboard";
import ProvisioneurDashboard from "./ProvisioneurDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return <Redirect to="/login" />;

  switch (user.role) {
    case "enseignant":
      return <EnseignantDashboard />;
    case "titulaire":
      return <TitulaireDashboard />;
    case "secretaire":
      return <SecretaireDashboard />;
    case "parent":
      return <Redirect to="/bulletin" />;
    default:
      return <ProvisioneurDashboard />;
  }
}
