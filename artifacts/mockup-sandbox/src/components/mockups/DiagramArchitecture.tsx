import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
graph TB
    subgraph CLIENT["Navigateur PWA — React 18 + Vite"]
        direction LR
        UI["shadcn/ui + Tailwind"]
        RQ["TanStack Query v5"]
        WO["Wouter — 20+ pages"]
        PDF["PDF via window.print()"]
    end

    subgraph PROXY["Replit Reverse Proxy — mTLS"]
        direction LR
        P1["/ --> lwa-nzururu:3000"]
        P2["/api --> api-server:8080"]
        P3["/__mockup --> sandbox:8081"]
    end

    subgraph API["API Server — Express 5 / Node 24"]
        direction TB
        AUTH["/auth\nSession Map + scrypt\nRBAC par role"]
        USERS["/users\nGestion personnel"]
        STU["/students\nInscription + bulletins"]
        GRA["/grades\nP1 P2 ExS1 P3 P4 ExS2"]
        DEL["/deliberations\nApprobation Proviseur"]
        MSG["/messages\nChat polling 5s"]
        REP["/reports\nBulletin + palmares"]
        SUBJ["/subjects\nMatieres + affectations"]
        STAT["/stats\nTableau de bord"]
        ARC["/archives\nArchivage annuel"]
    end

    subgraph DB["PostgreSQL — Drizzle ORM"]
        T1[("users")]
        T2[("students")]
        T3[("grades")]
        T4[("classes")]
        T5[("subjects")]
        T6[("course_assignments")]
        T7[("deliberations")]
        T8[("messages")]
        T9[("archives")]
        T10[("settings")]
    end

    CLIENT -->|HTTPS| PROXY
    PROXY --> API
    AUTH --> T1
    USERS --> T1
    STU --> T2
    STU --> T4
    GRA --> T3
    GRA --> T5
    DEL --> T7
    MSG --> T8
    SUBJ --> T5
    SUBJ --> T6
    STAT --> T2 & T3
    ARC --> T9
`;

export default function DiagramArchitecture() {
  return <DiagramPage title="Diagramme de deploiement — Architecture de l'Infrastructure" subtitle="Replit Proxy, Express API, PostgreSQL — flux de donnees" diagram={D} />;
}
