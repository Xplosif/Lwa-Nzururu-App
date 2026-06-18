# Workspace

## Overview

pnpm workspace monorepo using TypeScript. **Institut Lwa-Nzururu** — a French-language school management system (PWA) for a school in DRC (Butembo, Nord-Kivu).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind + Wouter routing + Recharts

## Artifacts

- `artifacts/api-server` — REST API (Express), port 8080, path `/api`
- `artifacts/lwa-nzururu` — React PWA frontend, previewPath `/`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Demo Credentials

- Proviseur: `proviseur` / `admin123`
- Secretaire: `secretaire1` / `secretaire123`

## Features

- Role-based access: Proviseur, Titulaire, Enseignant, Secretaire
- Statistical dashboard with pass rates by class and gender (Recharts)
- Student management (Fiche A + B)
- Grade entry by period (P1, P2, Exam S1, P3, P4, Exam S2, Bonus)
- Annual archiving system
- PDF report generation: bulletins individuels + palmarès (print CSS via window.print())
- Automatic signature block on PDFs (configurable in settings)

## Architecture Notes

- Session-based auth: in-memory Map with cookie sessionId (scrypt password hashing)
- SESSION_SECRET env var required
- Pass threshold: 50%
- Academic year default: 2024-2025
- All UI and error messages in French
- No emojis in UI
- School info: Institut Lwa-Nzururu, Beni, Nord-Kivu, RDC
- Vite proxy: `/api` → `http://localhost:8080`

## DB Schema (lib/db/src/schema/)

- users, classes, subjects, students, grades, course_assignments, archives, settings
