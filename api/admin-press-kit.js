/**
 * Press Kit Configuration
 * GET /api/admin-press-kit          → { pressKit: {...} }
 * PUT /api/admin-press-kit { pressKit } → { success, pressKit }
 */
const { head, put } = require('@vercel/blob');

const BLOB_PATHNAME = 'admin/press-kit.json';

const DEFAULT_PRESS_KIT = {
  artistName: 'Nickola Magnolia',
  genre: 'Indie / Alternative',
  hometown: '',
  bio: '',
  shortBio: '',
  pressPhotos: [],
  streamingLinks: {
    spotify: '',
    appleMusic: '',
    youtube: '',
    soundcloud: '',
  },
  socialLinks: {
    instagram: '',
    tiktok: '',
    twitter: '',
    facebook: '',
  },
  contactEmail: '',
  managementEmail: '',
  bookingEmail: '',
  achievements: [],
  updatedAt: null,
};

async function readPressKit() {
  try {
    const meta = await head(BLOB_PATHNAME, { token: process.env.BLOB_READ_WRITE_TOKEN });
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
    return await res.json();
  } catch {
    return DEFAULT_PRESS_KIT;
  }
}

async function writePressKit(pressKit) {
  await put(BLOB_PATHNAME, JSON.stringify(pressKit), {
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
    const pressKit = await readPressKit();
    return res.status(200).json({ pressKit });
  }

  if (req.method === 'PUT') {
    const { pressKit } = req.body || {};
    if (!pressKit) {
      return res.status(400).json({ success: false, message: 'Press kit data required' });
    }
    const updated = { ...pressKit, updatedAt: new Date().toISOString() };
    await writePressKit(updated);
    return res.status(200).json({ success: true, pressKit: updated });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
