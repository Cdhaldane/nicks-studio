/**
 * Setlist Manager
 * GET    /api/admin-setlists                → { setlists: [...] }
 * POST   /api/admin-setlists  { setlist }   → { success, setlist }
 * PUT    /api/admin-setlists  { setlists }  → { success, setlists }
 * DELETE /api/admin-setlists  { id }        → { success }
 */
const { head, put } = require('@vercel/blob');

const BLOB_PATHNAME = 'admin/setlists.json';

async function readSetlists() {
  try {
    const meta = await head(BLOB_PATHNAME, { token: process.env.BLOB_READ_WRITE_TOKEN });
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
    return await res.json();
  } catch {
    return [];
  }
}

async function writeSetlists(setlists) {
  await put(BLOB_PATHNAME, JSON.stringify(setlists), {
    access: 'public',
    allowOverwrite: true,
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: 'application/json',
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const setlists = await readSetlists();
    return res.status(200).json({ setlists });
  }

  if (req.method === 'POST') {
    const { setlist } = req.body || {};
    if (!setlist || !setlist.name) {
      return res.status(400).json({ success: false, message: 'Setlist name is required' });
    }
    const setlists = await readSetlists();
    const newSetlist = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: setlist.name,
      songs: setlist.songs || [],
      showDate: setlist.showDate || null,
      venue: setlist.venue || '',
      notes: setlist.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setlists.push(newSetlist);
    await writeSetlists(setlists);
    return res.status(201).json({ success: true, setlist: newSetlist });
  }

  if (req.method === 'PUT') {
    const { setlists } = req.body || {};
    if (!Array.isArray(setlists)) {
      return res.status(400).json({ success: false, message: 'Invalid setlists data' });
    }
    const updated = setlists.map(s => ({ ...s, updatedAt: new Date().toISOString() }));
    await writeSetlists(updated);
    return res.status(200).json({ success: true, setlists: updated });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'ID required' });
    const setlists = await readSetlists();
    const filtered = setlists.filter(s => s.id !== id);
    await writeSetlists(filtered);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
