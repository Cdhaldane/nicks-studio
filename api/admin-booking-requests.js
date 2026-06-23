/**
 * Booking Requests (Admin)
 * GET    /api/admin-booking-requests            → { requests: [...] }
 * PUT    /api/admin-booking-requests  { id, status } → update status
 * DELETE /api/admin-booking-requests  { id }    → remove request
 */
const { head, put } = require('@vercel/blob');

const BLOB_PATHNAME = 'admin/booking-requests.json';

async function readRequests() {
  try {
    const meta = await head(BLOB_PATHNAME, { token: process.env.BLOB_READ_WRITE_TOKEN });
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
    return await res.json();
  } catch {
    return [];
  }
}

async function writeRequests(requests) {
  await put(BLOB_PATHNAME, JSON.stringify(requests), {
    access: 'public',
    allowOverwrite: true,
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: 'application/json',
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const requests = await readRequests();
    return res.status(200).json({ requests });
  }

  if (req.method === 'PUT') {
    const { id, status } = req.body || {};
    if (!id || !['pending', 'accepted', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid id or status' });
    }
    const requests = await readRequests();
    const updated = requests.map(r =>
      r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
    );
    await writeRequests(updated);
    return res.status(200).json({ success: true, requests: updated });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'ID required' });
    const requests = await readRequests();
    await writeRequests(requests.filter(r => r.id !== id));
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
