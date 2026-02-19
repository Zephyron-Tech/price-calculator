import type { NextApiRequest, NextApiResponse } from 'next';
import { storageGet, storageSet } from '../../lib/storage';
import type { City } from '../../lib/model';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const cities = await storageGet();
      return res.status(200).json(cities);
    }

    if (req.method === 'POST') {
      const { city } = req.body as { city?: City };
      if (!city || !city.id) {
        return res.status(400).json({ error: 'Missing city or city.id' });
      }
      const cities = await storageGet();
      const idx = cities.findIndex((c) => c.id === city.id);
      if (idx >= 0) {
        cities[idx] = city;
      } else {
        cities.push(city);
      }
      await storageSet(cities);
      return res.status(200).json(cities);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing id query param' });
      }
      const cities = await storageGet();
      const filtered = cities.filter((c) => c.id !== id);
      await storageSet(filtered);
      return res.status(200).json(filtered);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[cities API]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
