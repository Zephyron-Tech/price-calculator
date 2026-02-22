# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-project pricing calculator for urban infrastructure systems. Currently supports two projects:
- **ClearWay** (v2.0) — intelligent road network management (Smart City / IZS), 8-step pricing model
- **DALRIS** (v1.0) — Disaster Alert & Response Information System, crisis communication via LoRa/WiFi/FM, OPEX/CAPEX model with hardware tiers

Built with Next.js 14 (pages router), TypeScript, Tailwind CSS, Recharts, and Prisma ORM with PostgreSQL.

## Commands

```bash
npm install          # Install dependencies
npx prisma generate  # Generate Prisma client (after schema changes)
npx prisma migrate dev --name <name>  # Create + apply migration
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint via next lint
```

No test framework is configured.

## Architecture

**Pages Router** (not App Router):
- `pages/index.tsx` — Homepage with project selection cards. Links to `/{slug}`.
- `pages/[project]/index.tsx` — Calculator UI (tabs: Calculator, Charts, Compare). Uses `getStaticPaths` / `getStaticProps` with project slugs.
- `pages/api/[project]/cities.ts` — Project-scoped REST endpoint (GET/POST/DELETE) for city CRUD.

**Project Registry** (`lib/projects/`):
- `registry.ts` — `ProjectDefinition` interface, `PROJECT_REGISTRY` map, `getProject()`, `PROJECT_SLUGS`. Each project defines its own `computeModel()`, `paramMeta`, `presetCities`, and `paramGroups`.
- `clearway/model.ts` — ClearWay 8-step pricing formula. Exports `computeModel`, `PARAM_META`, `PRESET_CITIES`.
- `clearway/index.ts` — Wraps model into `ProjectDefinition`.
- `dalris/model.ts` — DALRIS enterprise model with `HardwareTier[]`, OPEX/CAPEX formulas, SLA readiness.
- `dalris/index.ts` — Wraps model into `ProjectDefinition`.

**To add a new project**: create `lib/projects/<slug>/model.ts` + `index.ts`, register in `registry.ts`.

**Core Logic** (`lib/`):
- `db.ts` — Prisma client singleton (global caching in dev).
- `storage.ts` — Prisma-based, project-aware storage (`storageGet(slug)`, `storageSet(slug, city)`, `storageDelete(slug, id)`). City params stored as JSON column.
- `useCities.ts` — React hook `useCities(projectSlug)` managing city state with debounced saves (300ms) to `/api/{slug}/cities`.
- `useTheme.ts` — Dark/light theme toggle with localStorage persistence and system preference detection.
- `utils.ts` — `cn()` helper (clsx + tailwind-merge).

**Database** (`prisma/`):
- `schema.prisma` — City model with `id`, `projectSlug`, `name`, `params` (JSON), timestamps. Indexed on `projectSlug`.

**UI Components** (`components/ui/`): shadcn/ui primitives (button, input, slider, scroll-area) using Radix UI.

## Key Patterns

- **All UI text is in Czech** — maintain this convention.
- **Parameter definitions** are centralized in each project's `PARAM_META`. Each parameter has `min`, `max`, `step`, `label`, `unit`, and `group`.
- **Formatting helpers** (`fNum`, `fCZK`, `fPct`) in `pages/[project]/index.tsx` use Czech locale (`cs-CZ`).
- **Theming** uses CSS custom properties defined in `styles/globals.css` with `[data-theme="dark"]` / `[data-theme="light"]` selectors. Colors reference these variables via Tailwind config.
- **Path alias**: `@/*` maps to project root (configured in tsconfig.json).
- **Pluggable models**: Each project implements `ProjectDefinition` from `lib/projects/registry.ts`. The calculator page dynamically uses the project's model, params, presets, and tab config.

## Environment Variables

```
DATABASE_URL=postgresql://user:password@host:5432/price_calculator
```

## Routing

| Route | Content |
|-------|---------|
| `/` | Homepage — project selection cards |
| `/clearway` | ClearWay calculator (sliders, charts, compare, sidebar) |
| `/dalris` | DALRIS calculator (OPEX/CAPEX model, sliders + hardware tier editor) |
| `/api/{slug}/cities` | Project-scoped city CRUD |

## Mathematical Models

**ClearWay**: `P = a × L + b × SV_real`, where SV_real is the quality-adjusted social value derived from fleet coverage, data freshness, and emergency service parameters. Full 8-step computation in `lib/projects/clearway/model.ts`.

**DALRIS** (Disaster Alert & Response Information System): Crisis communication pricing — OPEX/CAPEX model with dynamic hardware tiers (LoRa sensors, WiFi info points, FM broadcast nodes).
- `OPEX = L_base + SUM(N_i × C_i) + V_readiness`
- `V_readiness = P_base_risk × (1 + 24 / t_recovery)` — SLA-driven readiness cost
- `CAPEX = SUM(N_i × unitCapex_i)` — one-time hardware investment
- Slider params: `L_base` (platform licence), `P_base_risk` (readiness base), `t_recovery` (SLA hours)
- Hardware tiers (`HardwareTier[]`): dynamic list of {name, count, maintenance, unitCapex} stored as JSON in city params
- Custom `DalrisCalculatorTab` with inline tier editor + OPEX/CAPEX result breakdown
- Full model in `lib/projects/dalris/model.ts`
