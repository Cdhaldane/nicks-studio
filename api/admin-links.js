/**
 * Link-in-Bio Manager
 * GET /api/admin-links          → { links: [...] }
 * PUT /api/admin-links { links } → { success, links }
 */
const { head, put } = require('@vercel/blob');

const BLOB_PATHNAME = 'admin/links.json';

const DEFAULT_LINKS = [
  { id: '1', title: 'Spotify', url: '', icon: 'spotify', active: true, order: 0 },
  { id: '2', title: 'Apple Music', url: '', icon: 'apple-music', active: true, order: 1 },
  { id: '3', title: 'Tour Dates', url: '', icon: 'calendar', active: true, order: 2 },
  { id: '4', title: 'Merch Store', url: '', icon: 'shopping', active: true, order: 3 },
  { id: '5', title: 'Instagram', url: '', icon: 'instagram', active: true, order: 4 },
  { id: '6', title: 'TikTok', url: '', icon: 'tiktok', active: true, order: 5 },
];

async function readLinks() {
  try {
    const meta = await head(BLOB_PATHNAME, { token: process.env.BLOB_READ_WRITE_TOKEN });
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
    return await res.json();
  } catch {
    return DEFAULT_LINKS;
  }
}

async function writeLinks(links) {
  await put(BLOB_PATHNAME, JSON.stringify(links), {
    access: 'public',
    allowOverwrite: true,
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: 'application/json',
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const links = await readLinks();
    return res.status(200).json({ links });
  }

  if (req.method === 'PUT') {
    const { links } = req.body || {};
    if (!Array.isArray(links)) {
      return res.status(400).json({ success: false, message: 'Invalid links data' });
    }
    await writeLinks(links);
    return res.status(200).json({ success: true, links });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
