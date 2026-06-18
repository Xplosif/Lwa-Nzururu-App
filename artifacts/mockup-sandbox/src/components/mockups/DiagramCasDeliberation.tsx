import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
graph LR
    TI((Titulaire))
    PR((Proviseur))
    PA((Parent))

    subgraph SYS["Module : Deliberation et Bulletins"]
        direction TB
        UC1["Creer une deliberation"]
        UC2["Calculer moyennes auto"]
        UC3["Attribuer points bonus"]
        UC4["Soumettre au Proviseur"]
        UC5["Approuver la deliberation"]
        UC6["Rejeter et retourner"]
        UC7["Consulter bulletin enfant"]
        UC8["Imprimer bulletin PDF"]
        UC9["Generer palmares classe"]
        UC10["Envoyer message Proviseur"]
    end

    TI --> UC1
    TI --> UC2
    TI --> UC3
    TI --> UC4
    PR --> UC5
    PR --> UC6
    PR --> UC9
    PA --> UC7
    PA --> UC8
    PA --> UC10
`;

export default function DiagramCasDeliberation() {
  return <DiagramPage title="Diagramme de cas d'utilisation — Deliberation et Bulletins" subtitle="Titulaire, Proviseur, Parent" diagram={D} />;
}
