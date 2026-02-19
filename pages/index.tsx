import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Head from 'next/head';
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Cell,
} from 'recharts';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { computeModel, PARAM_META, PRESET_CITIES, K_FLEET, T_IDEAL } from '../lib/model';
import type { City, ParamKey } from '../lib/model';
import { useCities } from '../lib/useCities';
import { useTheme } from '../lib/useTheme';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { ScrollArea } from '../components/ui/scroll-area';

// ─── Formatting ───────────────────────────────────────────────────────────────

function fNum(val: number, decimals = 0): string {
  if (!isFinite(val)) return '—';
  return val.toLocaleString('cs-CZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fCZK(val: number): string {
  if (!isFinite(val)) return '—';
  return val.toLocaleString('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  });
}

function fPct(val: number): string {
  if (!isFinite(val)) return '—';
  return (val * 100).toFixed(1) + ' %';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GROUPS = ['Infrastruktura', 'Sběr dat', 'IZS parametry', 'Cenový model'] as const;
const ALPHA_VALUES = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30];

const CHART_DARK = {
  accent:   '#1d6fe8',
  accentHi: '#3b8cf8',
  green:    '#10b981',
  orange:   '#f59e0b',
  red:      '#ef4444',
  text1:    '#a0bcd8',
  text2:    '#6f90aa',
  border:   '#1a2d4a',
  bg3:      '#0f1e35',
};

const CHART_LIGHT = {
  accent:   '#1d6fe8',
  accentHi: '#1558c9',
  green:    '#059669',
  orange:   '#d97706',
  red:      '#dc2626',
  text1:    '#1a3658',
  text2:    '#3b5e80',
  border:   '#b8cce8',
  bg3:      '#dce7f7',
};

type ChartColors = typeof CHART_DARK;
type TabId = 'calculator' | 'charts' | 'compare';

const TABS: { id: TabId; label: string }[] = [
  { id: 'calculator', label: 'Kalkulátor' },
  { id: 'charts',     label: 'Grafy'      },
  { id: 'compare',    label: 'Porovnání'  },
];

// ─── Inline-input helpers ─────────────────────────────────────────────────────

/** Returns the string shown in the editable number input for a stored value. */
function toDisplayValue(paramKey: ParamKey, val: number): string {
  if (paramKey === 'alpha' || paramKey === 'b') return (val * 100).toFixed(0); // 0.15 → "15"
  if (paramKey === 'delta_t') return val.toFixed(1);
  return String(Math.round(val));
}

/** Parses the raw typed string back to a stored value. */
function fromDisplayValue(paramKey: ParamKey, raw: string): number {
  const normalized = raw.replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(normalized);
  if (!isFinite(parsed)) return NaN;
  if (paramKey === 'alpha' || paramKey === 'b') return parsed / 100; // "15" → 0.15
  return parsed;
}

/** Round value to the nearest valid step. */
function snapToStep(val: number, step: number): number {
  const factor = 1e10;
  return Math.round(Math.round(val / step * factor) / factor) * step;
}

// ─── ParamSlider ──────────────────────────────────────────────────────────────

interface ParamSliderProps {
  paramKey: ParamKey;
  city: City;
  onUpdate: (key: ParamKey, value: number) => void;
}

function ParamSlider({ paramKey, city, onUpdate }: ParamSliderProps) {
  const meta  = PARAM_META[paramKey];
  const val   = city[paramKey] as number;

  const [inputStr, setInputStr] = useState(() => toDisplayValue(paramKey, val));
  const inputFocused = useRef(false);
  const inputRef     = useRef<HTMLInputElement>(null);

  // Sync display when the stored val changes externally (slider drag, preset load)
  useEffect(() => {
    if (!inputFocused.current) {
      setInputStr(toDisplayValue(paramKey, val));
    }
  }, [paramKey, val]);

  const tQtVal = paramKey === 'T'
    ? Math.min(1.0, Math.exp(-(val - T_IDEAL) / T_IDEAL))
    : null;

  function commitInput(raw: string) {
    const parsed = fromDisplayValue(paramKey, raw);
    if (!isFinite(parsed)) {
      setInputStr(toDisplayValue(paramKey, val));
      return;
    }
    const clamped = Math.max(meta.min, Math.min(meta.max, parsed));
    const snapped = snapToStep(clamped, meta.step);
    onUpdate(paramKey, snapped);
    setInputStr(toDisplayValue(paramKey, snapped));
  }

  const displayUnit = paramKey === 'alpha' || paramKey === 'b' ? '%' : meta.unit;

  return (
    <div className="mb-4">
      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="font-mono text-[14px] font-semibold text-cw-accent-hi min-w-[26px]">
          {meta.symbol}
        </span>
        <span className="text-[14px] text-cw-text-1 flex-1">{meta.label}</span>

        {/* Inline editable number */}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={inputStr}
          onChange={(e) => setInputStr(e.target.value)}
          onFocus={() => { inputFocused.current = true; }}
          onBlur={() => {
            inputFocused.current = false;
            commitInput(inputStr);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') inputRef.current?.blur();
            if (e.key === 'Escape') {
              setInputStr(toDisplayValue(paramKey, val));
              inputFocused.current = false;
              inputRef.current?.blur();
            }
          }}
          className="font-mono text-[15px] text-cw-text-0 text-right bg-transparent w-[60px] px-1 py-0 rounded-[4px] outline-none border border-transparent hover:border-cw-border focus:border-cw-accent transition-colors duration-100"
          aria-label={meta.label}
        />
        {displayUnit && (
          <span className="font-mono text-[12px] text-cw-text-2 -ml-0.5">{displayUnit}</span>
        )}
      </div>

      {/* ── Slider ──────────────────────────────────────────────────────── */}
      <Slider
        min={meta.min}
        max={meta.max}
        step={meta.step}
        value={[val]}
        onValueChange={([v]) => onUpdate(paramKey, v)}
      />

      {/* ── T freshness preview ─────────────────────────────────────────── */}
      {tQtVal !== null && (
        <div
          className="font-mono text-[12px] mt-1 leading-relaxed"
          style={{ color: val > 7 ? 'var(--cw-orange)' : 'var(--cw-green)' }}
        >
          → Qt&nbsp;=&nbsp;{(tQtVal * 100).toFixed(1)}&nbsp;%
          &nbsp;{val <= T_IDEAL ? '✓ optimální čerstvost' : val <= 7 ? '✓ přijatelné' : '⚠ mimo doporučený interval'}
        </div>
      )}

      {/* ── Coverage km note ────────────────────────────────────────────── */}
      {paramKey === 'coverage_pct' && (
        <div className="font-mono text-[12px] text-cw-text-2 mt-1 leading-relaxed">
          = {fNum(Math.round((val / 100) * city.L))} km z {fNum(city.L)} km celkem
        </div>
      )}
    </div>
  );
}

// ─── ResultCard ───────────────────────────────────────────────────────────────

interface ResultCardProps {
  label: string;
  value: string;
  sub?: string;
  hero?: boolean;
  color?: string;
}

function ResultCard({ label, value, sub, hero, color }: ResultCardProps) {
  const borderColor = color ?? (hero ? 'var(--cw-accent)'    : 'var(--cw-border)');
  const valueColor  = color ?? (hero ? 'var(--cw-accent-hi)' : 'var(--cw-text-0)');

  return (
    <div
      className={cn(
        'bg-cw-bg-3 border border-cw-border border-l-[3px] rounded-[6px] px-4 py-3 mb-2',
        hero && 'bg-cw-bg-2 shadow-[0_0_20px_rgba(29,111,232,0.15)] mt-3'
      )}
      style={{ borderLeftColor: borderColor }}
    >
      <div className="text-[13px] text-cw-text-2 tracking-[0.08em] uppercase mb-1">{label}</div>
      <div
        className={cn('font-mono font-semibold', hero ? 'text-[30px]' : 'text-[21px]')}
        style={{ color: valueColor }}
      >
        {value}
      </div>
      {sub && <div className="font-mono text-[12px] text-cw-text-2 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── CalculatorTab ────────────────────────────────────────────────────────────

interface CalculatorTabProps {
  city: City;
  onUpdate: (key: ParamKey, value: number) => void;
}

function CalculatorTab({ city, onUpdate }: CalculatorTabProps) {
  const m = useMemo(() => computeModel(city), [city]);
  const qColor = m.Q < 0.4 ? 'var(--cw-red)' : m.Q < 0.7 ? 'var(--cw-orange)' : 'var(--cw-green)';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_440px] lg:h-full lg:min-h-0">
      {/* ── Sliders ─────────────────────────────────────────────────── */}
      <div className="p-4 md:p-5 border-b border-cw-border lg:border-b-0 lg:border-r lg:overflow-y-auto">
        {GROUPS.map((group) => {
          const keys = Object.entries(PARAM_META)
            .filter(([, meta]) => meta.group === group)
            .map(([k]) => k as ParamKey);
          return (
            <div key={group} className="mb-6">
              <div className="text-[13px] font-bold tracking-[0.12em] uppercase text-cw-text-2 mb-3 pb-1.5 border-b border-cw-border">
                {group}
              </div>
              {keys.map((k) => (
                <ParamSlider key={k} paramKey={k} city={city} onUpdate={onUpdate} />
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Results ─────────────────────────────────────────────────── */}
      <div className="p-4 md:p-5 bg-cw-bg-1 lg:overflow-y-auto">
        <div className="text-[13px] font-bold tracking-[0.12em] uppercase text-cw-text-2 mb-4">
          Výsledky modelu
        </div>

        <ResultCard
          label="CI — Index pokrytí"
          value={fNum(m.CI, 2)}
          sub={`(V×d×365)/L — průměrný počet proměření km za rok (k_fleet = ${K_FLEET})`}
        />
        <ResultCard
          label="Qf — Kvalita vozového parku"
          value={fPct(m.Qf)}
          sub="1 − e^(−CI/k_fleet) — jak dobře fleet pokrývá síť frekvencí"
        />
        <ResultCard
          color={city.T > 7 ? 'var(--cw-orange)' : 'var(--cw-green)'}
          label="Qt — Čerstvost dat"
          value={fPct(m.Qt)}
          sub={`T = ${city.T} dní${city.T > 7 ? ' ⚠ mimo optimální interval (≤ 7 dní)' : ' ✓ optimální interval'}`}
        />
        <ResultCard
          label="R — Pokrytí sítě"
          value={fPct(m.R)}
          sub={`${fNum(Math.round(m.L_measured))} km z ${fNum(city.L)} km celkem`}
        />
        <ResultCard
          color={qColor}
          label="Q — Celková kvalita dat"
          value={fPct(m.Q)}
          sub="Q = R × Qf × Qt"
        />
        <ResultCard
          label="SV — Teoretická společenská hodnota"
          value={fCZK(m.SV)}
          sub="E × α × Δt × Cm  (bez zohlednění kvality dat)"
        />
        <ResultCard
          label="SV_real — Reálná hodnota"
          value={fCZK(m.SV_real)}
          sub="SV × Q"
        />
        <ResultCard
          hero
          label="P — Roční cena systému"
          value={fCZK(m.P)}
          sub={`Infrastrukturní složka: ${fCZK(city.a * city.L)}  |  Hodnotová složka: ${fCZK(city.b * m.SV_real)}`}
        />
      </div>
    </div>
  );
}

// ─── ChartsTab ────────────────────────────────────────────────────────────────

interface ChartsTabProps {
  city: City;
  cities: City[];
  chartColors: ChartColors;
}

function ChartsTab({ city, cities, chartColors }: ChartsTabProps) {
  const m = useMemo(() => computeModel(city), [city]);

  const qfVsCiData = useMemo(() => {
    const pts: { CI: number; Qf: number; Q: number }[] = [];
    for (let ci = 0; ci <= 500; ci += 5) {
      const Qf = 1 - Math.exp(-ci / K_FLEET);
      pts.push({ CI: ci, Qf, Q: m.R * Qf * m.Qt });
    }
    return pts;
  }, [m.R, m.Qt]);

  const qtVsTData = useMemo(() => {
    const pts: { T: number; Qt: number }[] = [];
    for (let T = 1; T <= 30; T++) {
      pts.push({ T, Qt: Math.min(1.0, Math.exp(-(T - T_IDEAL) / T_IDEAL)) });
    }
    return pts;
  }, []);

  const svSensData = useMemo(() => {
    const closestAlpha = ALPHA_VALUES.reduce((prev, curr) =>
      Math.abs(curr - city.alpha) < Math.abs(prev - city.alpha) ? curr : prev
    );
    return ALPHA_VALUES.map((alpha) => ({
      label:    `${(alpha * 100).toFixed(0)} %`,
      alphaVal: alpha,
      SV_real:  Math.round(city.E * alpha * city.delta_t * city.Cm * m.Q),
      isActive: alpha === closestAlpha,
    }));
  }, [city, m.Q]);

  const priceData = useMemo(() =>
    cities
      .map((c) => {
        const cm = computeModel(c);
        return {
          name:           c.name,
          infrastruktura: Math.round(c.a * c.L),
          hodnota:        Math.round(c.b * cm.SV_real),
        };
      })
      .sort((a, b) => (b.infrastruktura + b.hodnota) - (a.infrastruktura + a.hodnota)),
    [cities]
  );

  const tooltipStyle = {
    backgroundColor: chartColors.bg3,
    border:          `1px solid ${chartColors.border}`,
    borderRadius:    6,
    fontFamily:      'JetBrains Mono, monospace',
    fontSize:        12,
    color:           chartColors.text1,
  };
  const axisProps = {
    tick:     { fill: chartColors.text2, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
    axisLine: { stroke: chartColors.border },
    tickLine: { stroke: chartColors.border },
  };
  const gridProps = { stroke: chartColors.border, strokeDasharray: '3 3' };
  const pctFmt    = (v: number) => `${(v * 100).toFixed(0)} %`;
  const kFmt      = (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}k`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 p-3 md:p-5">

      {/* 1) Qf and Q vs CI ────────────────────────────────────────────── */}
      <div className="bg-cw-bg-2 border border-cw-border rounded-[6px] p-3 md:p-4">
        <div className="text-[13px] font-semibold tracking-[0.08em] uppercase text-cw-text-1 mb-3.5">
          Kvalita vs. index pokrytí (CI) — k_fleet = {K_FLEET}
        </div>
        <div className="h-[200px] sm:h-[240px] xl:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={qfVsCiData} margin={{ top: 22, right: 16, bottom: 5, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="CI" {...axisProps} />
            <YAxis domain={[0, 1]} {...axisProps} tickFormatter={pctFmt} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [`${(v * 100).toFixed(1)} %`, name]}
              labelFormatter={(l: number) => `CI = ${l}`}
            />
            <ReferenceLine
              x={parseFloat(m.CI.toFixed(0))}
              stroke={chartColors.orange}
              strokeDasharray="5 3"
              label={{ value: `CI = ${m.CI.toFixed(1)}`, position: 'insideTopRight', fill: chartColors.orange, fontSize: 10 }}
            />
            <ReferenceLine
              y={m.Qt}
              stroke={chartColors.text2}
              strokeDasharray="3 3"
              label={{ value: `Qt = ${(m.Qt * 100).toFixed(0)} %`, position: 'insideBottomRight', fill: chartColors.text2, fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: chartColors.text1 }} />
            <Line type="monotone" dataKey="Qf" stroke={chartColors.accent}  dot={false} strokeWidth={2} name="Qf (fleet)" />
            <Line type="monotone" dataKey="Q"  stroke={chartColors.green}   dot={false} strokeWidth={2} name="Q = R×Qf×Qt" strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* 2) Qt vs T ───────────────────────────────────────────────────── */}
      <div className="bg-cw-bg-2 border border-cw-border rounded-[6px] p-3 md:p-4">
        <div className="text-[13px] font-semibold tracking-[0.08em] uppercase text-cw-text-1 mb-3.5">
          Vliv čerstvosti dat (T) — Qt
        </div>
        <div className="h-[200px] sm:h-[240px] xl:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={qtVsTData} margin={{ top: 22, right: 16, bottom: 5, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="T" {...axisProps} label={{ value: 'dní', position: 'insideBottomRight', offset: -5, fill: chartColors.text2, fontSize: 11 }} />
            <YAxis domain={[0, 1]} {...axisProps} tickFormatter={pctFmt} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${(v * 100).toFixed(1)} %`, 'Qt']}
              labelFormatter={(l: number) => `T = ${l} dní`}
            />
            <ReferenceArea
              x1={7} x2={30}
              fill={chartColors.red}
              fillOpacity={0.07}
              label={{ value: 'mimo optimum', position: 'insideTopLeft', fill: chartColors.red, fontSize: 10 }}
            />
            <ReferenceLine
              x={7}
              stroke={chartColors.red}
              strokeDasharray="4 2"
              label={{ value: 'T = 7', position: 'insideTopRight', fill: chartColors.red, fontSize: 10 }}
            />
            <ReferenceLine
              x={Math.min(city.T, 30)}
              stroke={chartColors.orange}
              strokeDasharray="5 3"
              label={{ value: `Aktuální T = ${city.T} dní`, position: 'insideBottomRight', fill: chartColors.orange, fontSize: 10 }}
            />
            <Line type="monotone" dataKey="Qt" stroke={chartColors.orange} dot={false} strokeWidth={2} name="Qt" />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* 3) SV_real sensitivity on alpha ─────────────────────────────── */}
      <div className="bg-cw-bg-2 border border-cw-border rounded-[6px] p-3 md:p-4">
        <div className="text-[13px] font-semibold tracking-[0.08em] uppercase text-cw-text-1 mb-3.5">
          Citlivost na alpha (podíl ovlivněných zásahů)
        </div>
        <div className="h-[200px] sm:h-[240px] xl:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={svSensData} margin={{ top: 10, right: 16, bottom: 5, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} tickFormatter={kFmt} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fCZK(v), 'SV_real']} />
            <Bar dataKey="SV_real" radius={[3, 3, 0, 0]} name="SV_real">
              {svSensData.map((entry) => (
                <Cell
                  key={entry.label}
                  fill={entry.isActive ? chartColors.orange : chartColors.accent}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* 4) Price breakdown ──────────────────────────────────────────── */}
      <div className="bg-cw-bg-2 border border-cw-border rounded-[6px] p-3 md:p-4">
        <div className="text-[13px] font-semibold tracking-[0.08em] uppercase text-cw-text-1 mb-3.5">
          Srovnání cen — struktura
        </div>
        <div className="h-[200px] sm:h-[240px] xl:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={priceData} margin={{ top: 10, right: 16, bottom: 5, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} tickFormatter={kFmt} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fCZK(v)]} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: chartColors.text1 }} />
            <Bar dataKey="infrastruktura" stackId="p" fill={chartColors.accentHi} name="a × L" />
            <Bar dataKey="hodnota"        stackId="p" fill={chartColors.green}    radius={[3, 3, 0, 0]} name="b × SV_real" />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

// ─── CompareTab ───────────────────────────────────────────────────────────────

interface ColDef {
  key: string;
  label: string;
  fmt: (v: unknown) => string;
  align: 'left' | 'right';
}

const COMPARE_COLS: ColDef[] = [
  { key: 'name',    label: 'Město',          fmt: (v) => String(v),      align: 'left'  },
  { key: 'L',       label: 'L (km)',          fmt: (v) => fNum(v as number),       align: 'right' },
  { key: 'V',       label: 'V',               fmt: (v) => fNum(v as number),       align: 'right' },
  { key: 'T',       label: 'T (dní)',         fmt: (v) => fNum(v as number),       align: 'right' },
  { key: 'CI',      label: 'CI',              fmt: (v) => fNum(v as number, 1),    align: 'right' },
  { key: 'R',       label: 'R %',             fmt: (v) => fPct(v as number),       align: 'right' },
  { key: 'Qf',      label: 'Qf %',            fmt: (v) => fPct(v as number),       align: 'right' },
  { key: 'Q',       label: 'Q %',             fmt: (v) => fPct(v as number),       align: 'right' },
  { key: 'SV_real', label: 'SV_real (Kč)',    fmt: (v) => fCZK(v as number),       align: 'right' },
  { key: 'P',       label: 'P (Kč/rok)',      fmt: (v) => fCZK(v as number),       align: 'right' },
];

function qColorClass(q: number): string {
  if (q < 0.4) return 'text-cw-red';
  if (q < 0.7) return 'text-cw-orange';
  return 'text-cw-green';
}

interface CompareTabProps {
  cities: City[];
  activeCityId: string | null;
}

function CompareTab({ cities, activeCityId }: CompareTabProps) {
  const [sortKey, setSortKey] = useState('P');
  const [sortAsc, setSortAsc] = useState(false);

  type CityRow = City & ReturnType<typeof computeModel>;

  const rows = useMemo<CityRow[]>(
    () => cities.map((c) => ({ ...c, ...computeModel(c) })),
    [cities]
  );

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[sortKey] ?? '';
        const bv = (b as unknown as Record<string, unknown>)[sortKey] ?? '';
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortAsc ? av - bv : bv - av;
        }
        return sortAsc
          ? String(av).localeCompare(String(bv), 'cs')
          : String(bv).localeCompare(String(av), 'cs');
      }),
    [rows, sortKey, sortAsc]
  );

  function handleSort(key: string) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  return (
    <div className="p-3 md:p-5">
      <div className="overflow-x-auto border border-cw-border rounded-[6px]">
        <table className="w-full border-collapse font-mono text-[13px]">
          <thead className="bg-cw-bg-2 sticky top-0 z-[1]">
            <tr>
              {COMPARE_COLS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={cn(
                    'px-3.5 py-2.5 text-[12px] font-bold tracking-[0.08em] uppercase border-b border-cw-border whitespace-nowrap cursor-pointer select-none',
                    col.align === 'left' ? 'text-left' : 'text-right',
                    sortKey === col.key ? 'text-cw-accent-hi' : 'text-cw-text-2 hover:text-cw-text-1'
                  )}
                >
                  {col.label}{sortKey === col.key ? (sortAsc ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.id}
                className={row.id === activeCityId ? 'bg-[rgba(29,111,232,0.06)]' : ''}
              >
                {COMPARE_COLS.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3.5 py-2 border-b border-cw-border whitespace-nowrap',
                      col.align === 'left'
                        ? cn(
                            'text-left font-sans font-semibold text-cw-text-0',
                            row.id === activeCityId && 'text-cw-accent-hi'
                          )
                        : 'text-right text-cw-text-1',
                      col.key === 'Q' && qColorClass(row.Q)
                    )}
                  >
                    {col.fmt((row as unknown as Record<string, unknown>)[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  cities: City[];
  activeCityId: string | null;
  setActiveCityId: (id: string) => void;
  saving: boolean;
  addCity: (name: string, defaults?: Partial<Omit<City, 'id' | 'name'>>) => void;
  deleteCity: (id: string) => void;
  onClose: () => void;
}

function Sidebar({ cities, activeCityId, setActiveCityId, saving, addCity, deleteCity, onClose }: SidebarProps) {
  const [newName, setNewName] = useState('');

  const handleAdd = useCallback(() => {
    const name = newName.trim();
    if (!name) return;
    addCity(name);
    setNewName('');
  }, [newName, addCity]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  }, [handleAdd]);

  const handlePreset = useCallback((preset: Omit<City, 'id'>) => {
    const { name, ...params } = preset;
    addCity(name, params);
  }, [addCity]);

  return (
    <aside className="w-[280px] xl:w-[300px] bg-cw-bg-1 border-r border-cw-border flex flex-col overflow-hidden h-full">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-4 py-3.5 border-b border-cw-border shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[12px] font-bold tracking-[0.12em] uppercase text-cw-text-2">
            Města
          </div>
          <button
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-[6px] text-cw-text-2 hover:text-cw-text-0 hover:bg-cw-bg-2 transition-colors"
            onClick={onClose}
            aria-label="Zavřít panel"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-1.5">
          <Input
            placeholder="Název města…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button size="icon" onClick={handleAdd} title="Přidat město">+</Button>
        </div>
        <div className="text-[12px] text-cw-text-2 tracking-[0.08em] uppercase mt-2.5 mb-1">
          Rychlé přidání
        </div>
        <div className="flex flex-wrap gap-1">
          {PRESET_CITIES.map((p) => (
            <Button key={p.name} variant="outline" size="sm" onClick={() => handlePreset(p)}>
              {p.name}
            </Button>
          ))}
        </div>
      </div>

      {/* ── City List ───────────────────────────────────────────────── */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {cities.map((city) => {
            const m = computeModel(city);
            return (
              <div
                key={city.id}
                className={cn(
                  'px-4 py-3 cursor-pointer border-l-2 transition-colors',
                  city.id === activeCityId
                    ? 'bg-cw-bg-2 border-cw-accent'
                    : 'border-transparent hover:bg-cw-bg-2'
                )}
                onClick={() => { setActiveCityId(city.id); onClose(); }}
              >
                <div className="font-semibold text-[15px] text-cw-text-0">{city.name}</div>
                <div className="font-mono text-[13px] text-cw-accent-hi mt-0.5">
                  {fCZK(m.P)} / rok
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-cw-border shrink-0">
        <div className="font-mono text-[13px] text-cw-text-2 flex items-center gap-1.5 mb-2">
          {saving ? (
            <><span className="saving-dot" />Ukládám…</>
          ) : (
            <span className="text-cw-green">✓ Uloženo</span>
          )}
        </div>
        <Button
          variant="ghost"
          className="w-full"
          disabled={cities.length <= 1}
          onClick={() => activeCityId && deleteCity(activeCityId)}
        >
          Smazat {cities.find((c) => c.id === activeCityId)?.name ?? 'město'}
        </Button>
      </div>
    </aside>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('calculator');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const chartColors = theme === 'dark' ? CHART_DARK : CHART_LIGHT;

  const {
    cities, activeCity, activeCityId,
    setActiveCityId, saving, loaded,
    addCity, deleteCity, updateParam,
  } = useCities();

  const handleParamUpdate = useCallback((key: ParamKey, value: number) => {
    if (!activeCityId) return;
    updateParam(activeCityId, key, value);
  }, [activeCityId, updateParam]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen font-mono text-[14px] text-cw-text-2 tracking-[0.08em]">
        Načítám data…
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>ClearWay Model v2.0</title>
        <meta name="description" content="Matematický model průjezdnosti silnic — Smart City / IZS" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="flex h-screen overflow-hidden bg-cw-bg-0 text-cw-text-0 antialiased">
        {/* ── Mobile backdrop ───────────────────────────────────────────── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar wrapper — drawer on mobile, static on desktop ──────── */}
        <div className={cn(
          'fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:flex-shrink-0',
        )}>
          <Sidebar
            cities={cities}
            activeCityId={activeCityId}
            setActiveCityId={setActiveCityId}
            saving={saving}
            addCity={addCity}
            deleteCity={deleteCity}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* ── Header ────────────────────────────────────────────── */}
          <header className="h-[58px] bg-cw-bg-1 border-b border-cw-border flex items-center px-4 md:px-6 shrink-0 gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-[6px] text-cw-text-2 hover:text-cw-text-0 hover:bg-cw-bg-2 transition-colors cursor-pointer"
              onClick={() => setSidebarOpen(true)}
              aria-label="Otevřít panel měst"
            >
              <Menu size={18} />
            </button>
            <span className="text-[19px] font-extrabold tracking-[0.06em] text-cw-text-0">
              CLEARWAY
            </span>
            <span className="font-mono text-[12px] text-cw-text-2 tracking-[0.05em] hidden sm:inline">
              MODEL v2.0
            </span>
            <div className="flex-1" />
            {activeCity && (
              <span className="font-mono text-[13px] text-cw-text-2 hidden md:inline">{activeCity.name}</span>
            )}
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-[6px] text-cw-text-2 hover:text-cw-text-0 hover:bg-cw-bg-2 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Přepnout na světlý motiv' : 'Přepnout na tmavý motiv'}
              aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </header>

          {/* ── Tab Bar ───────────────────────────────────────────── */}
          <nav className="h-[46px] bg-cw-bg-1 border-b border-cw-border flex items-end px-3 md:px-5 gap-0.5 shrink-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={cn(
                  'bg-transparent border-b-2 text-[13px] font-semibold tracking-[0.06em] uppercase px-3 md:px-4 pt-2.5 pb-2 transition-colors cursor-pointer',
                  activeTab === t.id
                    ? 'border-cw-accent text-cw-text-0'
                    : 'border-transparent text-cw-text-2 hover:text-cw-text-1'
                )}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* ── Tab Content ───────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {activeTab === 'calculator' && activeCity && (
              <CalculatorTab city={activeCity} onUpdate={handleParamUpdate} />
            )}
            {activeTab === 'charts' && activeCity && (
              <ChartsTab city={activeCity} cities={cities} chartColors={chartColors} />
            )}
            {activeTab === 'compare' && (
              <CompareTab cities={cities} activeCityId={activeCityId} />
            )}
            {!activeCity && (
              <div className="p-10 text-cw-text-2 font-mono text-[14px]">
                Vyberte nebo přidejte město v postranním panelu.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
