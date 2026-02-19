# ClearWay Model v2.0

Matematický model průjezdnosti silnic pro Smart City / IZS aplikace.
Sdílená data přes **Vercel KV** — více uživatelů vidí stejná data v reálném čase.

## Požadavky

- Node.js 18+
- Vercel CLI (`npm i -g vercel`)
- Vercel účet s přístupem k Vercel KV

---

## Lokální vývoj

### 1. Instalace závislostí

```bash
npm install
```

### 2. Přihlášení a propojení s Vercel projektem

```bash
vercel login
vercel link
```

### 3. Vytvoření Vercel KV databáze

```bash
vercel kv create clearway-db
```

> Pokud KV databáze již existuje, přeskočte tento krok.

### 4. Stažení env proměnných

```bash
vercel env pull .env.local
```

Tento příkaz vytvoří soubor `.env.local` s vyplněnými hodnotami:
```
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
```

### 5. Spuštění vývojového serveru

```bash
npm run dev
```

Aplikace běží na [http://localhost:3000](http://localhost:3000).

---

## Nasazení na Vercel

```bash
vercel deploy
```

Nebo produkční nasazení:

```bash
vercel --prod
```

---

## Matematický model

| Krok | Vzorec | Popis |
|------|--------|-------|
| CI | `(V × d × 365) / L` | Index pokrytí |
| k  | `365 / T` | Saturační konstanta |
| Qf | `1 − e^(−CI/k)` | Kvalita frekvence |
| R  | `min(L_m / L, 1)` | Poměr pokrytí |
| Q  | `R × Qf` | Kombinovaná kvalita |
| SV | `E × α × Δt × Cm` | Teoretická sociální hodnota |
| SV_real | `SV × Q` | Reálná sociální hodnota |
| P  | `a × L + b × SV_real` | Výsledná cena |

## Parametry

| Symbol | Popis | Jednotka |
|--------|-------|----------|
| L | Celková délka silnic | km |
| L_m | Proměřená délka | km |
| V | Počet vozidel | vozidel |
| d | Denní km / vozidlo | km/voz |
| T | Interval aktualizace | dní |
| E | Výjezdy IZS ročně | výjezdů |
| α | Podíl ovlivněných výjezdů | 0–1 |
| Δt | Úspora času / výjezd | min |
| Cm | Hodnota minuty | CZK/min |
| a | Cena infrastruktury | CZK/km |
| b | Podíl hodnoty | 0–1 |

## Struktura projektu

```
clearway-model/
  pages/
    _app.js           ← Global CSS import
    index.js          ← Hlavní aplikace (UI)
    api/
      cities.js       ← REST API (Vercel KV CRUD)
  lib/
    model.js          ← computeModel(), PARAM_META, PRESET_CITIES
    useCities.js      ← Custom React hook
  styles/
    globals.css       ← CSS proměnné + layout
  .env.local.example  ← Vzorové env proměnné
  vercel.json         ← Konfigurace Vercel
  README.md
```

## Technologie

- **Next.js 14** (pages router)
- **Vercel KV** — Redis-kompatibilní KV databáze pro sdílená data
- **Recharts** — Grafy
- **UUID** — Generování ID měst
- **Syne + JetBrains Mono** — Google Fonts
