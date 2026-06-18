import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
graph LR
    EN((Enseignant))
    TI((Titulaire))
    PR((Proviseur))

    subgraph SYS["Module : Gestion des Notes"]
        direction TB
        UC1["Saisir une note"]
        UC2["Modifier une note"]
        UC3["Supprimer une note"]
        UC4["Consulter notes d'une classe"]
        UC5["Cloturer une periode"]
        UC6["Generer palmares classe"]
        UC7["Exporter rapport PDF"]
    end

    EN --> UC1
    EN --> UC2
    EN --> UC3
    TI --> UC1
    TI --> UC2
    TI --> UC4
    TI --> UC5
    TI --> UC6
    TI --> UC7
    PR --> UC4
    PR --> UC6
    PR --> UC7
`;

export default function DiagramCasNotes() {
  return <DiagramPage title="Diagramme de cas d'utilisation — Gestion des Notes" subtitle="Enseignant, Titulaire, Proviseur — periodes P1 P2 ExS1 P3 P4 ExS2" diagram={D} />;
}
