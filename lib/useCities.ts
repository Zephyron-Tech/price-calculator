import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getProject } from './projects/registry';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GenericCity {
  id: string;
  name: string;
  [key: string]: unknown;
}

// ─── Schema migration (clearway only) ───────────────────────────────────────
// v1 stored L_measured in km; v2 uses coverage_pct (0–100).

function migrateCity(city: GenericCity): GenericCity {
  if (city.coverage_pct !== undefined) return city;
  const L = city.L as number | undefined;
  const L_measured = city.L_measured as number | undefined;
  const pct = L && L > 0 && L_measured !== undefined
    ? Math.min(100, Math.round((L_measured / L) * 100))
    : 60;
  const { L_measured: _dropped, ...rest } = city;
  return { ...rest, coverage_pct: pct };
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useCities(projectSlug: string) {
  const [cities, setCities] = useState<GenericCity[]>([]);
  const [activeCityId, setActiveCityId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apiBase = `/api/${projectSlug}/cities`;

  // ─── Internal save helper ──────────────────────────────────────────────────
  const saveCity = useCallback(async (city: GenericCity): Promise<GenericCity[]> => {
    setSaving(true);
    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        console.error('[saveCity] Unexpected response', res.status, data);
        return [city];
      }
      setCities(data);
      return data;
    } finally {
      setSaving(false);
    }
  }, [apiBase]);

  // ─── Debounced save (300 ms) ───────────────────────────────────────────────
  const debouncedSave = useCallback((city: GenericCity) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaving(true);
    debounceRef.current = setTimeout(() => {
      saveCity(city);
    }, 300);
  }, [saveCity]);

  // ─── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    const project = getProject(projectSlug);
    if (!project) return;

    fetch(apiBase)
      .then((r) => r.json())
      .then(async (data: GenericCity[]) => {
        if (data.length === 0) {
          // Seed with first preset
          const preset = project.presetCities[0];
          if (preset) {
            const city: GenericCity = { ...preset, id: uuidv4() } as GenericCity;
            const seeded = await saveCity(city);
            setActiveCityId(seeded[0]?.id ?? null);
          }
        } else {
          // Migrate clearway cities that pre-date the coverage_pct field
          const migrated = projectSlug === 'clearway' ? data.map(migrateCity) : data;
          setCities(migrated);
          setActiveCityId(migrated[0].id);
          // Persist migrations silently if any city changed
          if (projectSlug === 'clearway' && migrated.some((c, i) => c !== data[i])) {
            migrated.forEach((c) => saveCity(c));
          }
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [projectSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Add city ─────────────────────────────────────────────────────────────
  const addCity = useCallback(
    async (name: string, defaults: Partial<GenericCity> = {}): Promise<GenericCity[]> => {
      const project = getProject(projectSlug);
      const baseDefaults = project?.presetCities[0] ?? {};
      const city: GenericCity = {
        ...baseDefaults,
        ...defaults,
        id: uuidv4(),
        name,
      } as GenericCity;
      const updated = await saveCity(city);
      const newCity = updated.find((c) => c.id === city.id);
      setActiveCityId(newCity?.id ?? updated[0]?.id ?? null);
      return updated;
    },
    [projectSlug, saveCity]
  );

  // ─── Delete city ──────────────────────────────────────────────────────────
  const deleteCity = useCallback(
    async (id: string): Promise<GenericCity[]> => {
      const res = await fetch(`${apiBase}?id=${id}`, { method: 'DELETE' });
      const data = await res.json() as GenericCity[];
      setCities(data);
      if (activeCityId === id) {
        setActiveCityId(data[0]?.id ?? null);
      }
      return data;
    },
    [apiBase, activeCityId]
  );

  // ─── Update a single parameter ────────────────────────────────────────────
  const updateParam = useCallback(
    (cityId: string, key: string, value: number) => {
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
