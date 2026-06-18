import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
graph LR
    PR((Proviseur))
    SE((Secretaire))
    TI((Titulaire))
    PA((Parent))

    subgraph SYS["Module : Gestion des Eleves"]
        direction TB
        UC1["Inscrire un eleve"]
        UC2["Consulter fiche eleve"]
        UC3["Modifier fiche eleve"]
        UC4["Supprimer un eleve"]
        UC5["Generer compte parent"]
        UC6["Transferer eleve de classe"]
        UC7["Archiver annee scolaire"]
        UC8["Consulter bulletin enfant"]
        UC9["Imprimer bulletin"]
    end

    SE --> UC1
    SE --> UC2
    SE --> UC3
    SE --> UC5
    PR --> UC4
    PR --> UC6
    PR --> UC7
    TI --> UC2
    PA --> UC8
    PA --> UC9
`;

export default function DiagramCasEleves() {
  return <DiagramPage title="Diagramme de cas d'utilisation — Gestion des Eleves" subtitle="Secretaire, Proviseur, Titulaire, Parent" diagram={D} />;
}
