import { useEffect, useRef } from "react";

const DIAGRAM = `
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
    }
    STUDENTS {
        int id PK
        text registration_number UK
        text last_name
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
    }
    GRADES {
        int id PK
        int student_id FK
        int subject_id FK
        int class_id FK
        text period
        real value
    }
    COURSE_ASSIGNMENTS {
        int id PK
        int titulaire_id FK
        int class_id FK
        int subject_id FK
        text academic_year
    }
    ARCHIVES {
        int id PK
        text academic_year UK
        jsonb data
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
    USERS ||--o{ COURSE_ASSIGNMENTS : "assigne a"
    SUBJECTS ||--o{ COURSE_ASSIGNMENTS : "enseigne dans"
`;

export default function DiagramER() {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const existing = document.getElementById("mermaid-script");
    if (existing) { initMermaid(); return; }
    const script = document.createElement("script");
    script.id = "mermaid-script";
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
    script.onload = initMermaid;
    document.head.appendChild(script);

    function initMermaid() {
      const m = (window as any).mermaid;
      if (!m || !ref.current) return;
      m.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });
      const id = "mermaid-er-" + Date.now();
      m.render(id, DIAGRAM).then(({ svg }: { svg: string }) => {
        if (ref.current) ref.current.innerHTML = svg;
      }).catch(console.error);
    }
  }, []);

  return (
    <div style={{ padding: "24px", background: "#f8fafc", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <div style={{ background: "#1e3a5f", color: "#fff", padding: "12px 20px", borderRadius: "8px", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Diagramme de base de donnees (ER)</h2>
        <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.8 }}>Schema relationnel PostgreSQL — toutes les tables</p>
      </div>
      <div style={{ background: "#fff", borderRadius: "8px", padding: "20px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
        <pre ref={ref} style={{ margin: 0 }}>Chargement du diagramme...</pre>
      </div>
    </div>
  );
}
