import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
flowchart TD
    Start([Debut]) --> A[Secretaire ouvre\nformulaire inscription]
    A --> B[Saisir etat civil eleve\nnoms, date naissance, lieu...]
    B --> C[Saisir informations parent\nnom, fonction, telephone]
    C --> D[Selectionner classe cible]
    D --> E{Formulaire valide?}
    E -- Erreurs --> F[Afficher messages\nd'erreur validation]
    F --> B
    E -- Valide --> G[Enregistrer eleve en BD]
    G --> H[Generer numero matricule\nunique automatique]
    H --> I[Creer compte parent\nautomatiquement]
    I --> J[Generer identifiants\ntemporaires parent]
    J --> K[Afficher credentials\na transmettre]
    K --> L{Inscrire un\nautre eleve?}
    L -- Oui --> A
    L -- Non --> End([Fin])
`;

export default function DiagramActiviteInscription() {
  return <DiagramPage title="Diagramme d'activite — Inscription d'un Eleve" subtitle="Acteur principal : Secretaire" diagram={D} />;
}
