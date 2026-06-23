/**
 * Social Media Stats/Config
 * GET /api/admin-social          → { social: {...} }
 * PUT /api/admin-social { social } → { success, social }
 */
const { head, put } = require('@vercel/blob');

const BLOB_PATHNAME = 'admin/social-stats.json';

const DEFAULT_SOCIAL = {
  platforms: [
    { id: 'instagram', name: 'Instagram', handle: '', followers: 0, url: '', active: true },
    { id: 'tiktok', name: 'TikTok', handle: '', followers: 0, url: '', active: true },
    { id: 'youtube', name: 'YouTube', handle: '', subscribers: 0, url: '', active: true },
    { id: 'twitter', name: 'X / Twitter', handle: '', followers: 0, url: '', active: true },
    { id: 'facebook', name: 'Facebook', handle: '', followers: 0, url: '', active: false },
  ],
  lastUpdated: null,
};

async function readSocial() {
  try {
    const meta = await head(BLOB_PATHNAME, { token: process.env.BLOB_READ_WRITE_TOKEN });
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
    return await res.json();
  } catch {
    return DEFAULT_SOCIAL;
  }
}

async function writeSocial(social) {
  await put(BLOB_PATHNAME, JSON.stringify(social), {
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
    const social = await readSocial();
    return res.status(200).json({ social });
  }

  if (req.method === 'PUT') {
    const { social } = req.body || {};
    if (!social) return res.status(400).json({ success: false, message: 'Social data required' });
    const updated = { ...social, lastUpdated: new Date().toISOString() };
    await writeSocial(updated);
    return res.status(200).json({ success: true, social: updated });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
