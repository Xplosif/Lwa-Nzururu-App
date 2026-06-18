import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
graph LR
    PR((Proviseur))

    subgraph SYS["Module : Gestion du Personnel"]
        direction TB
        UC1["Creer compte enseignant"]
        UC2["Creer compte titulaire"]
        UC3["Creer compte secretaire"]
        UC4["Affecter enseignant a un cours"]
        UC5["Affecter titulaire a une classe"]
        UC6["Consulter liste personnel"]
        UC7["Supprimer un compte"]
        UC8["Voir statut premier acces"]
    end

    PR --> UC1
    PR --> UC2
    PR --> UC3
    PR --> UC4
    PR --> UC5
    PR --> UC6
    PR --> UC7
    PR --> UC8
`;

export default function DiagramCasPersonnel() {
  return <DiagramPage title="Diagramme de cas d'utilisation — Gestion du Personnel" subtitle="Proviseur — creation et affectation des comptes" diagram={D} />;
}
