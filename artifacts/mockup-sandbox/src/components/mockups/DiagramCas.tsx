import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
graph LR
    PR((Proviseur))
    TI((Titulaire))
    EN((Enseignant))
    SE((Secretaire))
    PA((Parent))

    subgraph SYS["Institut Lwa-Nzururu — Systeme Global"]
        direction TB
        UC1["Gerer personnel"]
        UC2["Voir tableau de bord"]
        UC3["Approuver deliberation"]
        UC4["Configurer ecole"]
        UC5["Generer rapports PDF"]
        UC6["Saisir notes"]
        UC7["Gerer deliberation"]
        UC8["Gerer eleves et classes"]
        UC9["Inscrire un eleve"]
        UC10["Consulter bulletin"]
        UC11["Envoyer message"]
        UC12["Affecter cours a enseignant"]
    end

    PR --> UC1 & UC2 & UC3 & UC4 & UC5 & UC11 & UC12
    TI --> UC6 & UC7 & UC8 & UC5
    EN --> UC6
    SE --> UC8 & UC9
    PA --> UC10 & UC11
`;

export default function DiagramCas() {
  return <DiagramPage title="Diagramme de cas d'utilisation — Systeme Global" subtitle="Institut Lwa-Nzururu — 5 acteurs, 12 cas d'utilisation" diagram={D} />;
}
