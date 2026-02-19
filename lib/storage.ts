/**
 * Storage adapter — dual-mode:
 *   • Local dev  → JSON file at data/cities.json
 *   • Production → Vercel KV (requires KV_REST_API_URL + KV_REST_API_TOKEN)
 */
import { promises as fs } from 'fs';
import path from 'path';
import type { City } from './model';

const KV_KEY   = 'clearway:cities';
const DATA_DIR  = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'cities.json');

function hasKV(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// ─── In-memory fallback (used when filesystem is read-only and KV is absent) ──

let memoryStore: City[] | null = null;

// ─── File-based fallback ───────────────────────────────────────────────────────

async function fileGet(): Promise<City[]> {
  try {
    const text = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(text) as City[];
  } catch {
    return memoryStore ?? [];
  }
}

async function fileSet(cities: City[]): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(cities, null, 2), 'utf-8');
  } catch {
    // Filesystem is read-only (e.g. Vercel serverless without KV configured).
    // Fall back to in-memory store so the API doesn't return 500.
    memoryStore = cities;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function storageGet(): Promise<City[]> {
  if (hasKV()) {
    const { kv } = await import('@vercel/kv');
    const data = await kv.get<City[]>(KV_KEY);
    return Array.isArray(data) ? data : [];
  }
  return fileGet();
}

export async function storageSet(cities: City[]): Promise<void> {
  if (hasKV()) {
    const { kv } = await import('@vercel/kv');
    await kv.set(KV_KEY, cities);
  } else {
    await fileSet(cities);
  }
}
