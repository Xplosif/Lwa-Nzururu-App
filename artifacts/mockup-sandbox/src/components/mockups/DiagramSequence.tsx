import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
sequenceDiagram
    autonumber
    actor PA as Parent
    actor SE as Secretaire
    actor EN as Enseignant
    actor TI as Titulaire
    actor PR as Proviseur
    participant API as API Server
    participant DB as PostgreSQL

    rect rgb(230, 245, 255)
        Note over SE,DB: Flux 1 — Inscription d'un eleve
        SE->>API: POST /students (etat civil + classe)
        API->>DB: INSERT INTO students
        DB-->>API: id, registration_number
        API->>DB: INSERT INTO users (compte parent)
        DB-->>API: username, temp_password
        API-->>SE: parentCredentials
        SE-->>PA: Transmettre identifiants
    end

    rect rgb(230, 255, 235)
        Note over EN,DB: Flux 2 — Saisie des notes
        EN->>API: POST /grades (studentId, subjectId, period, value)
        API->>DB: INSERT INTO grades
        DB-->>API: grade id
        API-->>EN: Note enregistree
    end

    rect rgb(255, 245, 230)
        Note over TI,PR: Flux 3 — Deliberation
        TI->>API: POST /deliberations (classId, semester)
        API->>DB: Calcul moyennes automatique
        PR->>API: POST /deliberations/:id/bonus
        API->>DB: Enregistrer bonus
        PR->>API: POST /deliberations/:id/approve
        API->>DB: approvedByProviseur = true
        API-->>PR: Bulletins publies
    end

    rect rgb(245, 230, 255)
        Note over PA,DB: Flux 4 — Consultation bulletin
        PA->>API: GET /parent/bulletin?semester=S1
        API->>DB: SELECT grades + rank + average
        DB-->>API: Donnees bulletin
        API-->>PA: Bulletin JSON
    end

    rect rgb(255, 230, 230)
        Note over PA,PR: Flux 5 — Chat parent-proviseur
        PA->>API: POST /messages (toUserId=proviseurId)
        API->>DB: INSERT INTO messages
        PR->>API: GET /messages/conversations (polling)
        API-->>PR: Messages recus
        PR->>API: POST /messages (reponse)
        API-->>PA: Reponse recue
    end
`;

export default function DiagramSequence() {
  return <DiagramPage title="Diagramme de sequence — Flux Principaux du Systeme" subtitle="5 flux : Inscription, Notes, Deliberation, Bulletin, Chat" diagram={D} />;
}
