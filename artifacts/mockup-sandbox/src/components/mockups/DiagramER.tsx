import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
erDiagram
    USERS {
        int id PK
        text username UK
        text password_hash
        text full_name
        text role
        boolean is_first_login
        text temp_username
        text temp_password
        int class_id FK
    }
    STUDENTS {
        int id PK
        text registration_number UK
        text last_name
        text postnom
        text first_name
        text gender
        text phone_number
        text date_of_birth
        text place_of_birth
        text father_name
        text mother_name
        text fonction
        text address
        int class_id FK
        text academic_year
    }
    CLASSES {
        int id PK
        text name
        text level
        text academic_year
    }
    SUBJECTS {
        int id PK
        text name
        int max_points
        int coefficient
        text category
    }
    GRADES {
        int id PK
        int student_id FK
        int subject_id FK
        int class_id FK
        text period
        real value
        timestamp created_at
    }
    COURSE_ASSIGNMENTS {
        int id PK
        int teacher_id FK
        int class_id FK
        int subject_id FK
        text academic_year
        timestamp created_at
    }
    DELIBERATIONS {
        int id PK
        int class_id FK
        text semester
        text status
        boolean approved_by_proviseur
        jsonb bonuses
        timestamp created_at
    }
    ARCHIVES {
        int id PK
        text academic_year UK
        jsonb data
        timestamp created_at
    }
    MESSAGES {
        int id PK
        int sender_id FK
        int recipient_id FK
        text content
        boolean is_read
        timestamp created_at
    }
    SETTINGS {
        int id PK
        text school_name
        text location
        text signature_block
    }

    STUDENTS ||--o{ GRADES : "possede"
    SUBJECTS ||--o{ GRADES : "evalue"
    CLASSES ||--o{ STUDENTS : "contient"
    CLASSES ||--o{ COURSE_ASSIGNMENTS : "gere par"
    CLASSES ||--o{ DELIBERATIONS : "fait lobjet de"
    USERS ||--o{ COURSE_ASSIGNMENTS : "enseigne"
    SUBJECTS ||--o{ COURSE_ASSIGNMENTS : "enseigne dans"
    USERS ||--o{ MESSAGES : "envoie"
    USERS ||--o{ MESSAGES : "recoit"
`;

export default function DiagramER() {
  return <DiagramPage title="Diagramme Entite-Relation — Schema PostgreSQL Complet" subtitle="Toutes les tables, colonnes, contraintes et relations" diagram={D} />;
}
