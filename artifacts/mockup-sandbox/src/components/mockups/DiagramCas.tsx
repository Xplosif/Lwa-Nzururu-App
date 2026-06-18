import { useEffect, useRef } from "react";

const DIAGRAM = `
graph LR
    PR((Proviseur))
    TI((Titulaire))
    EN((Enseignant))
    SE((Secretaire))
    PA((Parent))

    subgraph SYS["Institut Lwa-Nzururu"]
        direction TB
        UC1["Gerer utilisateurs"]
        UC2["Voir statistiques"]
        UC3["Approuver deliberation"]
        UC4["Configurer ecole"]
        UC5["Generer rapports PDF"]
        UC6["Saisir notes"]
        UC7["Cloturer deliberation"]
        UC8["Gerer eleves / classes"]
        UC9["Inscrire un eleve"]
        UC10["Consulter bulletin"]
        UC11["Envoyer message au Proviseur"]
    end

    PR --> UC1
    PR --> UC2
    PR --> UC3
    PR --> UC4
    PR --> UC5
    TI --> UC6
    TI --> UC7
    TI --> UC8
    TI --> UC5
    EN --> UC6
    SE --> UC9
    SE --> UC8
    PA --> UC10
    PA --> UC11
`;

export default function DiagramCas() {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const existing = document.getElementById("mermaid-script");
    if (existing) {
      initMermaid();
      return;
    }
    const script = document.createElement("script");
    script.id = "mermaid-script";
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
    script.onload = initMermaid;
    document.head.appendChild(script);

    function initMermaid() {
      const m = (window as any).mermaid;
      if (!m || !ref.current) return;
      m.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });
      const id = "mermaid-cas-" + Date.now();
      m.render(id, DIAGRAM).then(({ svg }: { svg: string }) => {
        if (ref.current) ref.current.innerHTML = svg;
      }).catch(console.error);
    }
  }, []);

  return (
    <div style={{ padding: "24px", background: "#f8fafc", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <div style={{ background: "#1e3a5f", color: "#fff", padding: "12px 20px", borderRadius: "8px", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Diagramme de cas d&apos;utilisation</h2>
        <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.8 }}>Institut Lwa-Nzururu — acteurs et fonctionnalites</p>
      </div>
      <div style={{ background: "#fff", borderRadius: "8px", padding: "20px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
        <pre ref={ref} style={{ margin: 0 }}>Chargement du diagramme...</pre>
      </div>
    </div>
  );
}
