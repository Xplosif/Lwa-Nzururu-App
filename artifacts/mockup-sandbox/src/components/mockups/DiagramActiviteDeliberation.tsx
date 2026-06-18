import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
flowchart TD
    Start([Debut apres saisie notes]) --> A[Titulaire cree\nune deliberation]
    A --> B[Calcul automatique\nmoyennes eleves]
    B --> C[Calcul pourcentage\net rang classe]
    C --> D{Eleves en\ndifficulte?}
    D -- Oui --> E[Proviseur examine\nles cas limites]
    E --> F{Attribution\nbonus?}
    F -- Oui --> G[Saisir points bonus\npar eleve]
    G --> H[Recalcul moyennes\net rangs]
    H --> F
    F -- Non --> I[Soumettre deliberation\nau Proviseur]
    D -- Non --> I
    I --> J[Proviseur examine\nresultats globaux]
    J --> K{Deliberation\nacceptee?}
    K -- Non --> L[Renvoyer au Titulaire\navec commentaires]
    L --> A
    K -- Oui --> M[Approbation officielle\nProviseur]
    M --> N[Bulletins disponibles\npour les parents]
    N --> O[Generation palmares\nPDF par classe]
    O --> End([Fin])
`;

export default function DiagramActiviteDeliberation() {
  return <DiagramPage title="Diagramme d'activite — Processus de Deliberation" subtitle="Acteurs : Titulaire, Proviseur — validation et publication" diagram={D} />;
}
