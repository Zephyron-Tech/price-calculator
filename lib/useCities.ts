import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PRESET_CITIES, type City, type ParamKey } from './model';

// ─── Schema migration ──────────────────────────────────────────────────────────
// v1 stored L_measured in km; v2 uses coverage_pct (0–100).
type LegacyCity = Omit<City, 'coverage_pct'> & { coverage_pct?: number; L_measured?: number };

function migrateCity(city: LegacyCity): City {
  if (city.coverage_pct !== undefined) return city as City;
  const pct = city.L > 0 && city.L_measured !== undefined
    ? Math.min(100, Math.round((city.L_measured / city.L) * 100))
    : 60; // sensible default
  const { L_measured: _dropped, ...rest } = city;
  return { ...rest, coverage_pct: pct } as City;
}

export function useCities() {
  const [cities, setCities] = useState<City[]>([]);
  const [activeCityId, setActiveCityId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Internal save helper ──────────────────────────────────────────────────
  const saveCity = useCallback(async (city: City): Promise<City[]> => {
    setSaving(true);
    try {
      const res = await fetch('/api/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        // Server error (e.g. read-only filesystem on Vercel without KV) —
        // don't corrupt the cities state; return the city we tried to save.
        console.error('[saveCity] Unexpected response', res.status, data);
        return [city];
      }
      setCities(data);
      return data;
    } finally {
      setSaving(false);
    }
  }, []);

  // ─── Debounced save (300 ms) ───────────────────────────────────────────────
  const debouncedSave = useCallback((city: City) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaving(true);
    debounceRef.current = setTimeout(() => {
      saveCity(city);
    }, 300);
  }, [saveCity]);

  // ─── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/cities')
      .then((r) => r.json())
      .then(async (data: LegacyCity[]) => {
        if (data.length === 0) {
          // Seed with Plzeň preset
          const plzen: City = { ...PRESET_CITIES[0], id: uuidv4() };
          const seeded = await saveCity(plzen);
          setActiveCityId(seeded[0]?.id ?? null);
        } else {
          // Migrate cities that pre-date the coverage_pct field
          const migrated = data.map(migrateCity);
          setCities(migrated);
          setActiveCityId(migrated[0].id);
          // Persist migrations silently if any city changed
          if (migrated.some((c, i) => c !== (data[i] as unknown as City))) {
            migrated.forEach((c) => saveCity(c));
          }
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Add city ─────────────────────────────────────────────────────────────
  const addCity = useCallback(
    async (name: string, defaults: Partial<Omit<City, 'id' | 'name'>> = {}): Promise<City[]> => {
      const city: City = {
        ...PRESET_CITIES[0],
        ...defaults,
        id: uuidv4(),
        name,
      };
      const updated = await saveCity(city);
      const newCity = updated.find((c) => c.id === city.id);
      setActiveCityId(newCity?.id ?? updated[0]?.id ?? null);
      return updated;
    },
    [saveCity]
  );

  // ─── Delete city ──────────────────────────────────────────────────────────
  const deleteCity = useCallback(
    async (id: string): Promise<City[]> => {
      const res = await fetch(`/api/cities?id=${id}`, { method: 'DELETE' });
      const data = await res.json() as City[];
      setCities(data);
      if (activeCityId === id) {
        setActiveCityId(data[0]?.id ?? null);
      }
      return data;
    },
    [activeCityId]
  );

  // ─── Update a single parameter ────────────────────────────────────────────
  const updateParam = useCallback(
    (cityId: string, key: ParamKey, value: number) => {
      setCities((prev) => {
        const updated = prev.map((c) => {
          if (c.id !== cityId) return c;
          return { ...c, [key]: value };
        });
        const city = updated.find((c) => c.id === cityId);
        if (city) debouncedSave(city);
        return updated;
      });
    },
    [debouncedSave]
  );

  const activeCity = cities.find((c) => c.id === activeCityId) ?? null;

  return {
    cities,
    activeCity,
    activeCityId,
    setActiveCityId,
    saving,
    loaded,
    addCity,
    deleteCity,
    updateParam,
  };
}
