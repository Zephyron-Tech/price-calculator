import type { ProjectDefinition } from '../registry';
import { computeModel, PARAM_META, PRESET_CITIES } from './model';
import type { DalrisCity } from './model';

export type { DalrisCity };
export { computeModel, PARAM_META, PRESET_CITIES };

export const dalrisProject: ProjectDefinition = {
  slug: 'dalris',
  name: 'DALRIS',
  description: 'Diagnostika a analýza lokálních rizik infrastruktury silnic',
  version: 'v0.1',
  color: '#10b981',
  computeModel: (city) => computeModel(city as unknown as DalrisCity) as unknown as Record<string, number>,
  paramMeta: PARAM_META,
  presetCities: PRESET_CITIES,
  paramGroups: ['Infrastruktura', 'Cenový model'],
  hasCharts: false,
  compareColumns: [
    { key: 'name',       label: 'Město',       fmt: 'text', align: 'left'  },
    { key: 'L',          label: 'L (km)',       fmt: 'num',  align: 'right' },
    { key: 'pricePerKm', label: 'Kč/km',       fmt: 'num',  align: 'right' },
    { key: 'P',          label: 'P (Kč/rok)',   fmt: 'czk',  align: 'right' },
  ],
};
