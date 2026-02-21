/**
 * One-time migration: reads data/cities.json and inserts into PostgreSQL
 * with projectSlug = 'clearway'.
 *
 * Usage: npx tsx scripts/migrate-to-postgres.ts
 */
import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'cities.json');

interface LegacyCity {
  id: string;
  name: string;
  [key: string]: unknown;
}

async function main() {
  let raw: string;
  try {
    raw = await fs.readFile(DATA_FILE, 'utf-8');
  } catch {
    console.log('No data/cities.json found — nothing to migrate.');
    return;
  }

  const cities: LegacyCity[] = JSON.parse(raw);
  if (cities.length === 0) {
    console.log('cities.json is empty — nothing to migrate.');
    return;
  }

  const prisma = new PrismaClient();

  try {
    for (const city of cities) {
      const { id, name, ...params } = city;
      await prisma.city.upsert({
        where: { id },
        create: {
          id,
          projectSlug: 'clearway',
          name,
          params,
        },
        update: {
          name,
          params,
        },
      });
      console.log(`  Migrated: ${name} (${id})`);
    }
    console.log(`\nDone — ${cities.length} cities migrated to PostgreSQL with projectSlug = 'clearway'.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
