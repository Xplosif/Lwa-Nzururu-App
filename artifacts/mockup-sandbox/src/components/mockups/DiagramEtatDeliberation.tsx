import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
stateDiagram-v2
    [*] --> Ouverte : Titulaire cree la deliberation\n(notes de periode saisies)

    state Ouverte {
        [*] --> CalculInitial
        CalculInitial : Calcul auto moyennes\net rangs initiaux
    }

    Ouverte --> EnRevision : Examen des resultats\npar Titulaire

    state EnRevision {
        [*] --> AnalyseCas
        AnalyseCas --> BonusEnCours : Cas limite identifie
        BonusEnCours --> AnalyseCas : Bonus saisi
    }

    EnRevision --> SoumiseProviseur : Titulaire soumet\npour approbation

    state SoumiseProviseur {
        [*] --> EnAttenteDecision
        EnAttenteDecision : Proviseur examine\nresultats + rangs
    }

    SoumiseProviseur --> Approuvee : Proviseur approuve\nresultats definitifs
    SoumiseProviseur --> Rejetee : Proviseur rejette\ncorrections requises

    Rejetee --> EnRevision : Retour au Titulaire

    state Approuvee {
        [*] --> BulletinsPublies
        BulletinsPublies : Parents accedent\nbulletins en ligne
        BulletinsPublies --> PalmaresPDF : Generation rapport
    }

    Approuvee --> [*]
`;

export default function DiagramEtatDeliberation() {
  return <DiagramPage title="Diagramme d'etat — Processus de Deliberation" subtitle="Etats : Ouverte → Revision → Soumise → Approuvee / Rejetee" diagram={D} />;
}
