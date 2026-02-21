# Cenové modely — Multi-project pricing calculator

Cenové modely pro správu silniční infrastruktury. Podporuje více projektů s různými matematickými modely.

**Projekty:**
- **ClearWay v2.0** — Inteligentní správa silniční sítě (Smart City / IZS)
- **DALRIS v0.1** — Diagnostika a analýza lokálních rizik infrastruktury silnic (placeholder)

## Požadavky

- Node.js 18+
- PostgreSQL databáze

---

## Lokální vývoj

### 1. Instalace závislostí

```bash
npm install
```

### 2. Nastavení databáze

Vytvořte soubor `.env` v kořenové složce:

```
DATABASE_URL=postgresql://user:password@localhost:5432/price_calculator
```

### 3. Migrace databáze

```bash
npx prisma migrate dev --name init
```

### 4. (Volitelně) Migrace dat z cities.json

Pokud máte existující data v `data/cities.json`:

```bash
npx tsx scripts/migrate-to-postgres.ts
```

### 5. Spuštění vývojového serveru

```bash
npm run dev
```

Aplikace běží na [http://localhost:3000](http://localhost:3000).

---

## Nasazení

Nasazení na Hetzner VPS (nebo jiný server s PostgreSQL):

1. Nastavte `DATABASE_URL` v prostředí
2. `npx prisma migrate deploy`
3. `npm run build && npm run start`

---

## Routing

| Route | Obsah |
|-------|-------|
| `/` | Výběr projektu — karty ClearWay a DALRIS |
| `/clearway` | ClearWay kalkulátor (slidery, grafy, porovnání) |
| `/dalris` | DALRIS kalkulátor (placeholder model) |
| `/api/{slug}/cities` | REST API pro CRUD operace s městy |

---

## Matematický model — ClearWay

| Krok | Vzorec | Popis |
|------|--------|-------|
| CI | `(V × d × 365) / L` | Index pokrytí |
| Qf | `1 − e^(−CI/k_fleet)` | Kvalita frekvence |
| Qt | `min(1, e^(-(T-T_ideal)/T_ideal))` | Čerstvost dat |
| R  | `coverage_pct / 100` | Poměr pokrytí |
| Q  | `R × Qf × Qt` | Kombinovaná kvalita |
| SV | `E × α × Δt × Cm` | Teoretická sociální hodnota |
| SV_real | `SV × Q` | Reálná sociální hodnota |
| P  | `a × L + b × SV_real` | Výsledná cena |

## Matematický model — DALRIS (placeholder)

| Krok | Vzorec | Popis |
|------|--------|-------|
| P | `L × pricePerKm` | Cena za km × délka sítě |

---

## Struktura projektu

```
pages/
  index.tsx                    ← Homepage (výběr projektu)
  [project]/
    index.tsx                  ← Kalkulátor (dynamické dle projektu)
  api/
    [project]/
      cities.ts                ← REST API (PostgreSQL CRUD)
lib/
  db.ts                        ← Prisma client singleton
  storage.ts                   ← Prisma-based storage layer
  useCities.ts                 ← React hook (project-aware)
  useTheme.ts                  ← Dark/light theme toggle
  utils.ts                     ← Utility helpers
  projects/
    registry.ts                ← ProjectDefinition, registry
    clearway/
      model.ts                 ← ClearWay model
      index.ts                 ← ClearWay project definition
    dalris/
      model.ts                 ← DALRIS placeholder model
      index.ts                 ← DALRIS project definition
prisma/
  schema.prisma                ← Database schema
components/ui/                 ← shadcn/ui komponenty
styles/globals.css             ← CSS proměnné + layout
```

## Přidání nového projektu

1. Vytvořte `lib/projects/<slug>/model.ts` s `computeModel()`, `PARAM_META`, `PRESET_CITIES`
2. Vytvořte `lib/projects/<slug>/index.ts` implementující `ProjectDefinition`
3. Zaregistrujte v `lib/projects/registry.ts`

## Technologie

- **Next.js 14** (pages router)
- **Prisma** + **PostgreSQL** — databáze pro sdílená data
- **Recharts** — Grafy
- **Tailwind CSS** + **shadcn/ui** — Styling
- **UUID** — Generování ID měst
