import type { ProjectDefinition } from '../registry';
import { computeModel, PARAM_META, PRESET_CITIES, K_FLEET, T_IDEAL } from './model';
import type { City, ParamKey, ModelResult } from './model';

export type { City, ParamKey, ModelResult };
export { computeModel, PARAM_META, PRESET_CITIES, K_FLEET, T_IDEAL };

export const clearwayProject: ProjectDefinition = {
  slug: 'clearway',
  name: 'ClearWay',
  description: 'Cenový model inteligentní správy silniční sítě — Smart City / IZS',
  version: 'v2.0',
  color: '#1d6fe8',
  computeModel: (city) => computeModel(city as unknown as City) as unknown as Record<string, number>,
  paramMeta: PARAM_META,
  presetCities: PRESET_CITIES,
  paramGroups: ['Infrastruktura', 'Sběr dat', 'IZS parametry', 'Cenový model'],
  hasCharts: true,
  compareColumns: [
    { key: 'name',    label: 'Město',       fmt: 'text', align: 'left'  },
    { key: 'L',       label: 'L (km)',       fmt: 'num',  align: 'right' },
    { key: 'V',       label: 'V',            fmt: 'num',  align: 'right' },
    { key: 'T',       label: 'T (dní)',      fmt: 'num',  align: 'right' },
    { key: 'CI',      label: 'CI',           fmt: 'num',  decimals: 1, align: 'right' },
    { key: 'R',       label: 'R %',          fmt: 'pct',  align: 'right' },
    { key: 'Qf',      label: 'Qf %',         fmt: 'pct',  align: 'right' },
    { key: 'Q',       label: 'Q %',          fmt: 'pct',  align: 'right' },
    { key: 'SV_real', label: 'SV_real (Kč)', fmt: 'czk',  align: 'right' },
    { key: 'P',       label: 'P (Kč/rok)',   fmt: 'czk',  align: 'right' },
  ],
};
