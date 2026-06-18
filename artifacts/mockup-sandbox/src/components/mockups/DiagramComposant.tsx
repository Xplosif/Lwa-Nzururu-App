import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
graph TB
    subgraph CLIENT["Couche Presentation — React + Vite PWA"]
        direction LR
        UI["Composants UI\nshadcn/ui + Tailwind"]
        Router["Routeur Wouter\n20+ pages par role"]
        Charts["Recharts\nStatistiques"]
        QueryClient["TanStack Query\nCache + Synchronisation"]
        Hooks["Orval Generated Hooks\nAPI type-safe"]
    end

    subgraph API["Couche Metier — Express 5 API"]
        direction TB
        AuthRoute["Route /auth\nSession + RBAC"]
        StudRoute["Route /students\nInscription + Bulletins"]
        GradeRoute["Route /grades\nNotes P1-ExS2-Bonus"]
        DeliRoute["Route /deliberations\nDeliberation + Approbation"]
        MsgRoute["Route /messages\nChat temps reel"]
        RepRoute["Route /reports\nPDF Bulletin + Palmares"]
        SubRoute["Route /subjects\nMatieres + Affectations"]
        ArcRoute["Route /archives\nArchivage annuel"]
        StatRoute["Route /stats\nTableau de bord"]
    end

    subgraph SHARED["Bibliotheques Partagees — pnpm Workspace"]
        Spec["@workspace/api-spec\nOpenAPI YAML (source verite)"]
        ReactClient["@workspace/api-client-react\nHooks React Query"]
        ZodSchemas["@workspace/api-zod\nSchemas Zod validation"]
        DB["@workspace/db\nDrizzle ORM + Migrations"]
    end

    subgraph DATA["Couche Donnees — PostgreSQL"]
        PG[("Tables : users\nstudents, classes\nsubjects, grades\ncourse_assignments\narchives, settings")]
    end

    CLIENT --> API
    Hooks --> ReactClient
    ReactClient --> Spec
    ZodSchemas --> Spec
    API --> DB
    DB --> PG
`;

export default function DiagramComposant() {
  return <DiagramPage title="Diagramme de composants — Architecture Logicielle" subtitle="Frontend React, API Express, bibliotheques partagees, PostgreSQL" diagram={D} />;
}
