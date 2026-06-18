import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
graph LR
    U1((Proviseur))
    U2((Titulaire))
    U3((Enseignant))
    U4((Secretaire))
    U5((Parent))

    subgraph SYS["Module : Authentification"]
        direction TB
        UC1["Se connecter"]
        UC2["Se deconnecter"]
        UC3["Configurer 1er acces\n(changer identifiants)"]
        UC4["Modifier mot de passe"]
        UC5["Modifier identifiant"]
        UC6["Mettre a jour profil"]
    end

    U1 --> UC1 & UC2 & UC3 & UC4 & UC5 & UC6
    U2 --> UC1 & UC2 & UC3 & UC4 & UC5 & UC6
    U3 --> UC1 & UC2 & UC3 & UC4 & UC5 & UC6
    U4 --> UC1 & UC2 & UC3 & UC4 & UC5 & UC6
    U5 --> UC1 & UC2 & UC3 & UC4 & UC6
`;

export default function DiagramCasAuth() {
  return <DiagramPage title="Diagramme de cas d'utilisation — Authentification" subtitle="Tous les acteurs — gestion des comptes et sessions" diagram={D} />;
}
