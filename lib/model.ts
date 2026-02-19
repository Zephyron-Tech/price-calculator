// ─── Types ────────────────────────────────────────────────────────────────────

export interface City {
  id: string;
  name: string;
  L: number;
  coverage_pct: number;
  V: number;
  d: number;
  T: number;
  E: number;
  alpha: number;
  delta_t: number;
  Cm: number;
  a: number;
  b: number;
}

export interface ModelResult {
  CI: number;
  Qf: number;
  Qt: number;
  R: number;
  L_measured: number;
  Q: number;
  SV: number;
  SV_real: number;
  P: number;
}

export type ParamGroup = 'Infrastruktura' | 'Sběr dat' | 'IZS parametry' | 'Cenový model';
export type ParamKey = 'L' | 'coverage_pct' | 'V' | 'd' | 'T' | 'E' | 'alpha' | 'delta_t' | 'Cm' | 'a' | 'b';

export interface ParamMeta {
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  group: ParamGroup;
}

// ─── Constants ────────────────────────────────────────────────────────────────
// k_fleet: annual passes/km needed to reach ~63 % of max information value
export const K_FLEET = 100;
// T_ideal: optimal data freshness for IZS routing (days)
export const T_IDEAL = 3;

// ─── Math Model ────────────────────────────────────────────────────────────────
// Steps:
//   1. CI      = (V × d × 365) / L
//   2. Qf      = 1 - e^(-CI / K_FLEET)        ← fleet/frequency quality
//   3. Qt      = min(1, e^(-(T - T_ideal) / T_ideal))  ← data freshness quality
//   4. R       = coverage_pct / 100            (clamped 0–1)
//   5. Q       = R × Qf × Qt                  ← combined quality
//   6. SV      = E × alpha × delta_t × Cm
//   7. SV_real = SV × Q
//   8. P       = a×L + b×SV_real
// ────────────────────────────────────────────────────────────────────────────────

export function computeModel(city: City): ModelResult {
  const { L, coverage_pct, V, d, T, E, alpha, delta_t, Cm, a, b } = city;

  const CI         = (V * d * 365) / L;
  const Qf         = 1 - Math.exp(-CI / K_FLEET);
  const Qt         = Math.min(1.0, Math.exp(-(T - T_IDEAL) / T_IDEAL));
  const R          = Math.min(Math.max(coverage_pct / 100, 0), 1);
  const L_measured = R * L;                         // derived km — for display
  const Q          = R * Qf * Qt;
  const SV         = E * alpha * delta_t * Cm;
  const SV_real    = SV * Q;
  const P          = a * L + b * SV_real;

  return { CI, Qf, Qt, R, L_measured, Q, SV, SV_real, P };
}

// ─── Parameter Metadata ────────────────────────────────────────────────────────

export const PARAM_META: Record<ParamKey, ParamMeta> = {
  // ── Infrastruktura ──────────────────────────────────────────────────────────
  L: {
    label: 'Délka silniční sítě',
    symbol: 'L',
    unit: 'km',
    min: 10,
    max: 5000,
    step: 10,
    group: 'Infrastruktura',
  },
  coverage_pct: {
    label: 'Pokrytí sítě',
    symbol: 'L\u2098',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    group: 'Infrastruktura',
  },
  // ── Sběr dat ────────────────────────────────────────────────────────────────
  V: {
    label: 'Počet měřicích vozidel',
    symbol: 'V',
    unit: 'vozidel',
    min: 1,
    max: 100,
    step: 1,
    group: 'Sběr dat',
  },
  d: {
    label: 'Průměrný denní nájezd',
    symbol: 'd',
    unit: 'km/den',
    min: 10,
    max: 500,
    step: 5,
    group: 'Sběr dat',
  },
  T: {
    label: 'Požadovaný interval aktualizace',
    symbol: 'T',
    unit: 'dní',
    min: 1,
    max: 30,
    step: 1,
    group: 'Sběr dat',
  },
  // ── IZS parametry ───────────────────────────────────────────────────────────
  E: {
    label: 'Výjezdy IZS ročně',
    symbol: 'E',
    unit: 'výjezdů/rok',
    min: 100,
    max: 500000,
    step: 500,
    group: 'IZS parametry',
  },
  alpha: {
    label: 'Podíl ovlivněných výjezdů',
    symbol: 'α',
    unit: '',
    min: 0.01,
    max: 1.0,
    step: 0.01,
    group: 'IZS parametry',
  },
  delta_t: {
    label: 'Průměrná úspora času / výjezd',
    symbol: 'Δt',
    unit: 'min',
    min: 0.5,
    max: 30,
    step: 0.5,
    group: 'IZS parametry',
  },
  Cm: {
    label: 'Ekonomická hodnota minuty',
    symbol: 'C\u2098',
    unit: 'Kč/min',
    min: 500,
    max: 50000,
    step: 500,
    group: 'IZS parametry',
  },
  // ── Cenový model ────────────────────────────────────────────────────────────
  a: {
    label: 'Jednotková cena infrastruktury',
    symbol: 'a',
    unit: 'Kč/km',
    min: 100,
    max: 10000,
    step: 100,
    group: 'Cenový model',
  },
  b: {
    label: 'Podíl generované hodnoty systému',
    symbol: 'b',
    unit: '',
    min: 0.01,
    max: 0.5,
    step: 0.01,
    group: 'Cenový model',
  },
};

// ─── Preset Cities ─────────────────────────────────────────────────────────────

export const PRESET_CITIES: Omit<City, 'id'>[] = [
  {
    name: 'Plzeň',
    L: 420, coverage_pct: 60,
    V: 5, d: 75, T: 3,
    E: 15000, alpha: 0.15, delta_t: 1.5, Cm: 5000,
    a: 1000, b: 0.10,
  },
  {
    name: 'Praha',
    L: 3800, coverage_pct: 60,
    V: 18, d: 120, T: 3,
    E: 110000, alpha: 0.12, delta_t: 2.0, Cm: 5000,
    a: 1200, b: 0.10,
  },
  {
    name: 'Brno',
    L: 900, coverage_pct: 60,
    V: 7, d: 80, T: 4,
    E: 32000, alpha: 0.13, delta_t: 1.5, Cm: 5000,
    a: 1000, b: 0.10,
  },
  {
    name: 'Ostrava',
    L: 850, coverage_pct: 60,
    V: 6, d: 80, T: 5,
    E: 28000, alpha: 0.12, delta_t: 1.5, Cm: 5000,
    a: 950, b: 0.10,
  },
  {
    name: 'Olomouc',
    L: 380, coverage_pct: 60,
    V: 3, d: 70, T: 7,
    E: 10000, alpha: 0.10, delta_t: 1.0, Cm: 5000,
    a: 900, b: 0.10,
  },
  {
    name: 'Liberec',
    L: 460, coverage_pct: 60,
    V: 4, d: 70, T: 7,
    E: 11000, alpha: 0.10, delta_t: 1.0, Cm: 5000,
    a: 900, b: 0.10,
  },
];

// ─── Dev-time validation ───────────────────────────────────────────────────────
// Plzeň: T=3 → Qt=1.0, CI=325.9 → Qf≈0.962, R=0.60, Q≈0.577
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  const plzen = computeModel({ ...PRESET_CITIES[0], id: 'dev-check' });
  console.assert(Math.abs(plzen.R  - 0.60)  < 0.01,  'Plzeň R  check failed', plzen.R);
  console.assert(Math.abs(plzen.Qt - 1.00)  < 0.01,  'Plzeň Qt check failed', plzen.Qt);
  console.assert(Math.abs(plzen.Q  - 0.577) < 0.01,  'Plzeň Q  check failed', plzen.Q);
  console.assert(Math.abs(plzen.P  - 1393763) < 5000, 'Plzeň P  check failed', plzen.P);
}
