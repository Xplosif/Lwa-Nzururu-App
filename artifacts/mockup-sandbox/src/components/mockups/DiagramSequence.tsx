import { useEffect, useRef } from "react";

const DIAGRAM = `
sequenceDiagram
    autonumber
    actor PA as Parent
    actor SE as Secretaire
    actor EN as Enseignant/Titulaire
    actor PR as Proviseur
    participant API as API Server
    participant DB as PostgreSQL

    Note over SE,DB: Inscription d'un eleve
    SE->>API: POST /students (donnees eleve)
    API->>DB: INSERT INTO students
    DB-->>API: id, registration_number
    API->>DB: INSERT INTO users (compte parent)
    DB-->>API: username, temp_password
    API-->>SE: { parentCredentials }
    SE-->>PA: Transmettre identifiants

    Note over EN,DB: Saisie des notes
    EN->>API: PUT /grades/:id {period, value}
    API->>DB: UPDATE grades
    DB-->>API: OK
    API-->>EN: Note enregistree

    Note over EN,PR: Deliberation
    EN->>API: POST /proclamation (cloturer)
    API->>DB: Marquer deliberation close
    PR->>API: POST /deliberation (approuver)
    API->>DB: Valider resultats finaux
    DB-->>API: OK
    API-->>PR: Resultats valides

    Note over PA,DB: Consultation bulletin
    PA->>API: GET /bulletin?semester=S1
    API->>DB: SELECT notes + rang eleve
    DB-->>API: Donnees bulletin
    API-->>PA: { notes, rang, percentage }

    Note over PA,PR: Communication
    PA->>API: POST /messages {toUserId: proviseurId}
    API->>DB: INSERT INTO messages
    PR->>API: GET /messages (polling 5s)
    API-->>PR: Nouveaux messages
    PR->>API: POST /messages (reponse)
    API-->>PA: Message recu
`;

export default function DiagramSequence() {
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
      const id = "mermaid-seq-" + Date.now();
      m.render(id, DIAGRAM).then(({ svg }: { svg: string }) => {
        if (ref.current) ref.current.innerHTML = svg;
      }).catch(console.error);
    }
  }, []);

  return (
    <div style={{ padding: "24px", background: "#f8fafc", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <div style={{ background: "#1e3a5f", color: "#fff", padding: "12px 20px", borderRadius: "8px", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Diagramme de sequence</h2>
        <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.8 }}>Flux principaux : inscription, notes, deliberation, bulletin, chat</p>
      </div>
      <div style={{ background: "#fff", borderRadius: "8px", padding: "20px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
        <pre ref={ref} style={{ margin: 0 }}>Chargement du diagramme...</pre>
      </div>
    </div>
  );
}
