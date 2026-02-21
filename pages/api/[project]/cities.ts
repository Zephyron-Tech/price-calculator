import type { NextApiRequest, NextApiResponse } from 'next';
import { storageGet, storageSet, storageDelete } from '../../../lib/storage';
import { getProject } from '../../../lib/projects/registry';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const projectSlug = req.query.project as string;
  const project = getProject(projectSlug);

  if (!project) {
    return res.status(404).json({ error: `Unknown project: ${projectSlug}` });
  }

  try {
    if (req.method === 'GET') {
      const cities = await storageGet(projectSlug);
      return res.status(200).json(cities);
    }

    if (req.method === 'POST') {
      const { city } = req.body as { city?: { id: string; name: string; [key: string]: unknown } };
      if (!city || !city.id) {
        return res.status(400).json({ error: 'Missing city or city.id' });
      }
      await storageSet(projectSlug, city);
      const cities = await storageGet(projectSlug);
      return res.status(200).json(cities);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing id query param' });
      }
      await storageDelete(projectSlug, id);
      const cities = await storageGet(projectSlug);
      return res.status(200).json(cities);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(`[${projectSlug}/cities API]`, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
