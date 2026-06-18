import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
flowchart TD
    Start([Debut]) --> A[Enseignant selectionne\nclasse + matiere assignee]
    A --> B[Choisir la periode\nP1 P2 ExS1 P3 P4 ExS2]
    B --> C[Afficher liste eleves\nde la classe]
    C --> D[Saisir note pour un eleve]
    D --> E{Note valide\n0 to maxPoints?}
    E -- Non --> F[Afficher message erreur]
    F --> D
    E -- Oui --> G[Enregistrer note en BD]
    G --> H{Autres eleves\na noter?}
    H -- Oui --> D
    H -- Non --> I{Toutes periodes\ncompletes?}
    I -- Non --> B
    I -- Oui --> J[Titulaire consulte\nnotes de la classe]
    J --> K[Verifier coherence\ndes notes]
    K --> L{Corrections\nnecessaires?}
    L -- Oui --> D
    L -- Non --> M[Titulaire cree\nune deliberation]
    M --> End([Voir : Activite Deliberation])
`;

export default function DiagramActiviteNotes() {
  return <DiagramPage title="Diagramme d'activite — Saisie des Notes" subtitle="Acteurs : Enseignant, Titulaire — periodes P1 a ExS2" diagram={D} />;
}
