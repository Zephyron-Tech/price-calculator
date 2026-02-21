// ─── DALRIS — placeholder pricing model ──────────────────────────────────────
// Simple formula: P = L × pricePerKm
// This will be replaced with the real DALRIS model later.

export interface DalrisCity {
  id: string;
  name: string;
  L: number;           // délka silniční sítě (km)
  pricePerKm: number;  // cena za km (Kč/km)
}

export interface DalrisResult {
  P: number;
}

export type DalrisParamKey = 'L' | 'pricePerKm';

export function computeModel(city: DalrisCity): DalrisResult {
  const P = city.L * city.pricePerKm;
  return { P };
}

export const PARAM_META: Record<DalrisParamKey, {
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  group: string;
}> = {
  L: {
    label: 'Délka silniční sítě',
    symbol: 'L',
    unit: 'km',
    min: 10,
    max: 5000,
    step: 10,
    group: 'Infrastruktura',
  },
  pricePerKm: {
    label: 'Cena za km',
    symbol: 'P_km',
    unit: 'Kč/km',
    min: 100,
    max: 50000,
    step: 100,
    group: 'Cenový model',
  },
};

export const PRESET_CITIES: Omit<DalrisCity, 'id'>[] = [
  { name: 'Plzeň',  L: 420,  pricePerKm: 2000 },
  { name: 'Praha',   L: 3800, pricePerKm: 2500 },
  { name: 'Brno',    L: 900,  pricePerKm: 2000 },
];
