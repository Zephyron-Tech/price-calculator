import type { ProjectDefinition } from '../registry';
import { computeModel, PARAM_META, PRESET_CITIES, DEFAULT_TIERS, SLA_OPTIONS } from './model';
import type { DalrisCity, HardwareTier, DalrisResult } from './model';

export type { DalrisCity, HardwareTier, DalrisResult };
export { computeModel, PARAM_META, PRESET_CITIES, DEFAULT_TIERS, SLA_OPTIONS };

export const dalrisProject: ProjectDefinition = {
  slug: 'dalris',
  name: 'DALRIS',
  description: 'Krizový komunikační systém — monitoring infrastruktury přes LoRa rádio, distribuce informací při výpadku sítí',
  version: 'v1.0',
  color: '#10b981',
  computeModel: (city) => computeModel(city as unknown as DalrisCity) as unknown as Record<string, number>,
  paramMeta: PARAM_META,
  presetCities: PRESET_CITIES,
  paramGroups: ['Platforma', 'SLA & Pohotovost'],
  hasCharts: false,
  compareColumns: [
    { key: 'name',             label: 'Město',        fmt: 'text', align: 'left'  },
    { key: 'L_base',           label: 'Licence',      fmt: 'czk',  align: 'right' },
    { key: 'P_base_risk',      label: 'P_risk',       fmt: 'czk',  align: 'right' },
    { key: 't_recovery',       label: 'SLA (h)',      fmt: 'num',  align: 'right' },
    { key: 'V_readiness',      label: 'Pohotovost',   fmt: 'czk',  align: 'right' },
    { key: 'totalMaintenance',  label: 'Údržba',      fmt: 'czk',  align: 'right' },
    { key: 'P_OPEX',           label: 'OPEX/rok',     fmt: 'czk',  align: 'right' },
    { key: 'totalCAPEX',       label: 'CAPEX',        fmt: 'czk',  align: 'right' },
  ],
};
