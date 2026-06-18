import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
graph TB
    subgraph MONOREPO["pnpm Workspace Monorepo — Institut Lwa-Nzururu"]
        subgraph ART["artifacts/ — Applications deployables"]
            A1["lwa-nzururu\nReact 18 + Vite + Tailwind\nPWA — port 3000\npreviewPath: /"]
            A2["api-server\nExpress 5 + Drizzle\nREST API — port 8080\npreviewPath: /api"]
            A3["mockup-sandbox\nVite + React\nCanvas Preview — port 8081\npreviewPath: /__mockup"]
        end

        subgraph LIB["lib/ — Bibliotheques partagees composites TypeScript"]
            L1["api-spec\nOpenAPI 3.0 YAML\n(source de verite contractuelle)"]
            L2["api-client-react\nOrval generated\nReact Query hooks"]
            L3["api-zod\nOrval generated\nZod schemas"]
            L4["db\nDrizzle ORM schema\nMigrations PostgreSQL"]
        end

        subgraph SCR["scripts/ — Utilitaires"]
            S1["Scripts maintenance\ngeneration rapports"]
        end

        subgraph ROOT["Root — Orchestration"]
            R1["tsconfig.json\nSolution TS composite"]
            R2["pnpm-workspace.yaml\nCatalog + overrides"]
            R3["package.json\nScripts globaux"]
        end
    end

    A1 --> L2
    A1 --> L3
    A2 --> L4
    L2 --> L1
    L3 --> L1
    A2 --> L1
`;

export default function DiagramPackage() {
  return <DiagramPage title="Diagramme de packages — Organisation du Monorepo" subtitle="pnpm workspace : artifacts, lib, scripts — references TypeScript" diagram={D} />;
}
