import { useEffect, useRef } from "react";

const DIAGRAM = `
graph TB
    subgraph CLIENT["Navigateur / PWA (React + Vite)"]
        direction LR
        UI["Interface utilisateur\nTailwind CSS + shadcn/ui"]
        RQ["TanStack Query\nOrval hooks generes"]
        WO["Wouter Router\n5 roles / 20+ pages"]
    end

    subgraph PROXY["Replit Reverse Proxy (mTLS)"]
        P1["/ → lwa-nzururu:3000"]
        P2["/api → api-server:8080"]
        P3["/__mockup → mockup-sandbox:8081"]
    end

    subgraph API["API Server (Express 5 / Node 24)"]
        direction TB
        AUTH["/api/auth\nSession Map + scrypt\nRBAC middleware"]
        STU["/api/students\nInscription + bulletins parents"]
        GRA["/api/grades\nP1 P2 ExS1 P3 P4 ExS2 Bonus"]
        MSG["/api/messages\nChat temps reel polling 5s"]
        REP["/api/reports\nBulletin + palmares PDF"]
        DEL["/api/deliberation\nApprobation proviseur"]
        ARC["/api/archives\nArchivage annuel"]
    end

    subgraph DB["PostgreSQL (Drizzle ORM)"]
        T1[("users")]
        T2[("students")]
        T3[("grades")]
        T4[("classes / subjects")]
        T5[("course_assignments")]
        T6[("archives / settings")]
    end

    CLIENT --> PROXY
    PROXY --> API
    AUTH --> T1
    STU --> T2
    GRA --> T3
    STU --> T4
    GRA --> T4
    AUTH --> T5
    ARC --> T6
`;

export default function DiagramArchitecture() {
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
      const id = "mermaid-arch-" + Date.now();
      m.render(id, DIAGRAM).then(({ svg }: { svg: string }) => {
        if (ref.current) ref.current.innerHTML = svg;
      }).catch(console.error);
    }
  }, []);

  return (
    <div style={{ padding: "24px", background: "#f8fafc", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <div style={{ background: "#1e3a5f", color: "#fff", padding: "12px 20px", borderRadius: "8px", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Diagramme d&apos;architecture de deploiement</h2>
        <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.8 }}>Infrastructure Replit : proxy, services, base de donnees</p>
      </div>
      <div style={{ background: "#fff", borderRadius: "8px", padding: "20px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
        <pre ref={ref} style={{ margin: 0 }}>Chargement du diagramme...</pre>
      </div>
    </div>
  );
}
