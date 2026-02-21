/**
 * Storage adapter — Prisma / PostgreSQL.
 * Each city stores its model-specific parameters as a JSON column.
 * The public API is project-aware: all operations require a projectSlug.
 */
import { prisma } from './db';
import type { Prisma } from '@prisma/client';

export interface StoredCity {
  id: string;
  name: string;
  [key: string]: unknown;
}

// ─── Read all cities for a project ──────────────────────────────────────────

export async function storageGet(projectSlug: string): Promise<StoredCity[]> {
  const rows = await prisma.city.findMany({
    where: { projectSlug },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    ...(row.params as Record<string, unknown>),
  }));
}

// ─── Upsert a single city ───────────────────────────────────────────────────

export async function storageSet(projectSlug: string, city: StoredCity): Promise<void> {
  const { id, name, ...params } = city;
  const json = params as Prisma.InputJsonValue;
  await prisma.city.upsert({
    where: { id },
    create: { id, projectSlug, name, params: json },
    update: { name, params: json },
  });
}

// ─── Delete a city ──────────────────────────────────────────────────────────

export async function storageDelete(projectSlug: string, cityId: string): Promise<void> {
  await prisma.city.deleteMany({
    where: { id: cityId, projectSlug },
  });
}
