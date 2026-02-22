// ─── DALRIS — Disaster Alert & Response Information System ──────────────────
// Crisis communication pricing model (LoRa sensors, WiFi info points, FM nodes)
// OPEX  = L_base + SUM(N_i × C_i) + V_readiness
// V_readiness = P_base_risk × (1 + 24 / t_recovery)
// CAPEX = SUM(N_i × unitCapex_i)

export interface HardwareTier {
  name: string;        // e.g. "Senzor (LoRaWAN)"
  count: number;       // N_i
  maintenance: number; // C_i — annual maintenance per node (CZK)
  unitCapex: number;   // CAPEX per node (CZK)
}

export interface DalrisCity {
  id: string;
  name: string;
  L_base: number;       // Base Platform Fee (CZK)
  P_base_risk: number;  // Base Risk Fee (CZK)
  t_recovery: number;   // SLA Recovery Hours
  tiers: HardwareTier[];
}

export interface DalrisResult {
  V_readiness: number;
  totalMaintenance: number;
  P_OPEX: number;
  totalCAPEX: number;
  P: number; // alias for P_OPEX (sidebar compatibility)
}

export type DalrisParamKey = 'L_base' | 'P_base_risk' | 't_recovery';

export function computeModel(city: DalrisCity): DalrisResult {
  const tiers = Array.isArray(city.tiers) ? city.tiers : [];

  const V_readiness = city.P_base_risk * (1 + 24 / city.t_recovery);
  const totalMaintenance = tiers.reduce((sum, t) => sum + t.count * t.maintenance, 0);
  const P_OPEX = city.L_base + totalMaintenance + V_readiness;
  const totalCAPEX = tiers.reduce((sum, t) => sum + t.count * t.unitCapex, 0);

  return {
    V_readiness,
    totalMaintenance,
    P_OPEX,
    totalCAPEX,
    P: P_OPEX,
  };
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
  L_base: {
    label: 'Roční licence platformy',
    symbol: 'L_base',
    unit: 'Kč',
    min: 100000,
    max: 5000000,
    step: 50000,
    group: 'Platforma',
  },
  P_base_risk: {
    label: 'Pohotovostní báze',
    symbol: 'P_risk',
    unit: 'Kč',
    min: 50000,
    max: 2000000,
    step: 50000,
    group: 'SLA & Pohotovost',
  },
  t_recovery: {
    label: 'Doba obnovy (SLA)',
    symbol: 't_rec',
    unit: 'h',
    min: 4,
    max: 72,
    step: 4,
    group: 'SLA & Pohotovost',
  },
};

export const SLA_OPTIONS = [4, 12, 24, 48, 72] as const;

export const DEFAULT_TIERS: HardwareTier[] = [
  { name: 'Senzor (LoRaWAN)',   count: 50, maintenance: 2500,  unitCapex: 8000 },
  { name: 'WiFi Info Point',    count: 10, maintenance: 8000,  unitCapex: 45000 },
  { name: 'FM vysílací uzel',   count: 3,  maintenance: 15000, unitCapex: 120000 },
];

export const PRESET_CITIES: Omit<DalrisCity, 'id'>[] = [
  {
    name: 'Plzeň',
    L_base: 500000,
    P_base_risk: 200000,
    t_recovery: 24,
    tiers: [
      { name: 'Senzor (LoRaWAN)', count: 30, maintenance: 2500, unitCapex: 8000 },
      { name: 'WiFi Info Point',   count: 6,  maintenance: 8000, unitCapex: 45000 },
      { name: 'FM vysílací uzel',  count: 2,  maintenance: 15000, unitCapex: 120000 },
    ],
  },
  {
    name: 'Praha',
    L_base: 2000000,
    P_base_risk: 800000,
    t_recovery: 12,
    tiers: [
      { name: 'Senzor (LoRaWAN)', count: 150, maintenance: 2500, unitCapex: 8000 },
      { name: 'WiFi Info Point',   count: 30,  maintenance: 8000, unitCapex: 45000 },
      { name: 'FM vysílací uzel',  count: 8,   maintenance: 15000, unitCapex: 120000 },
    ],
  },
  {
    name: 'Brno',
    L_base: 800000,
    P_base_risk: 350000,
    t_recovery: 24,
    tiers: [
      { name: 'Senzor (LoRaWAN)', count: 50, maintenance: 2500, unitCapex: 8000 },
      { name: 'WiFi Info Point',   count: 10, maintenance: 8000, unitCapex: 45000 },
      { name: 'FM vysílací uzel',  count: 3,  maintenance: 15000, unitCapex: 120000 },
    ],
  },
];
