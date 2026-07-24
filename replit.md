# EcoRecicla Bogotá

A full-stack Recycling Management System for Residential Complexes in Bogotá, Colombia. Administrators manage recycling activities, recyclable materials, residents, collection events, recycling records, and environmental reports.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/ecorecicla run dev` — run the React frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed database with sample data
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, shadcn/ui, Recharts, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (bcryptjs + jsonwebtoken)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (users, complexes, materials, events, recyclingRecords)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, users, complexes, materials, events, records, dashboard, reports, profile)
- `artifacts/ecorecicla/src/pages/` — React pages (login, dashboard, users, complexes, materials, events, records, reports, profile)
- `scripts/src/seed.ts` — Sample data seeder

## Default Credentials

- Admin: `admin@ecorecicla.com` / `admin123`
- Resident: `maria.garcia@email.com` / `resident123`

## Modules

1. **Dashboard** — stats cards, monthly chart, material breakdown, recent activity
2. **Users** — CRUD with role (admin/resident) and status management
3. **Residential Complexes** — CRUD with neighborhood and administrator info
4. **Recyclable Materials** — CRUD for Plastic, Paper, Glass, Cardboard, Metal, Organic, Electronic
5. **Collection Events** — CRUD with scheduling and status tracking
6. **Recycling Records** — CRUD with kg tracking, auto-total calculation
7. **Reports** — Filter by date/material/resident/complex, charts, PDF/Excel export
8. **Profile** — Edit profile, change password, photo URL update

## Architecture decisions

- JWT stored in localStorage, sent as Bearer token; 401 responses clear token and redirect to /login
- OpenAPI-first: all types generated via Orval from `lib/api-spec/openapi.yaml`
- Drizzle ORM with `drizzle-kit push` for dev schema migrations
- bcryptjs for password hashing (salt rounds: 10)
- Numeric weights stored as `numeric` in Postgres, parsed to float in API responses

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before editing routes or frontend
- After codegen, run `pnpm run typecheck:libs` before leaf artifact typechecks
- Dashboard raw SQL uses `db.execute(sql\`...\`)` — cast result with `as unknown as any[]`
- `numeric` DB columns return strings from pg driver — always `parseFloat()` in route handlers

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
