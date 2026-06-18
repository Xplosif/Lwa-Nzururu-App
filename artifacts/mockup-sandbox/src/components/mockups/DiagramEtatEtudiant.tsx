import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
stateDiagram-v2
    [*] --> Inscrit : Inscription par Secretaire\n(matricule genere)

    state Inscrit {
        [*] --> ProfilComplet
        ProfilComplet : Fiche A + B\ncompte parent cree
    }

    Inscrit --> EnCoursAnnee : Debut annee scolaire\nnotes en cours de saisie

    state EnCoursAnnee {
        [*] --> S1
        S1 --> S2 : Semestre 1 cloture
        S2 : Semestre 2 en cours
    }

    EnCoursAnnee --> EnDeliberation : Titulaire cree deliberation

    state EnDeliberation {
        [*] --> MoyennesCalculees
        MoyennesCalculees --> BonusAttribue : Proviseur attribue bonus
        BonusAttribue --> MoyennesCalculees : Recalcul
        MoyennesCalculees --> SoumisProviseur
    }

    EnDeliberation --> Admis : Moyenne >= 50%\nProviseur approuve
    EnDeliberation --> Echoue : Moyenne < 50%\nProviseur approuve

    Admis --> Archive : Archivage fin annee
    Echoue --> Archive : Archivage fin annee
    Archive --> [*]
    Admis --> Inscrit : Reinscription classe superieure
`;

export default function DiagramEtatEtudiant() {
  return <DiagramPage title="Diagramme d'etat — Statut Academique d'un Eleve" subtitle="Etats : Inscrit → En cours → Deliberation → Admis/Echoue → Archive" diagram={D} />;
}
