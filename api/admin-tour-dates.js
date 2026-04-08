/**
 * Tour Dates Admin
 * GET  /api/admin-tour-dates  → { tourDates: [...] }
 * PUT  /api/admin-tour-dates  { tourDates: [...] } → { success, tourDates }
 */
const { head, put } = require('@vercel/blob');

const BLOB_PATHNAME = 'tour/dates.json';

async function readTourDates() {
  try {
    const meta = await head(BLOB_PATHNAME, { token: process.env.BLOB_READ_WRITE_TOKEN });
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
    return await res.json();
  } catch {
    return [];
  }
}

async function writeTourDates(tourDates) {
  await put(BLOB_PATHNAME, JSON.stringify(tourDates), {
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
    try {
      const tourDates = await readTourDates();
      return res.status(200).json({ tourDates });
    } catch (error) {
      console.error('Error reading tour dates:', error);
      return res.status(500).json({ tourDates: [] });
    }
  }

  if (req.method === 'PUT') {
    const { tourDates } = req.body || {};

    if (!Array.isArray(tourDates)) {
      return res.status(400).json({ success: false, message: 'tourDates must be an array' });
    }

    // Validate each entry
    for (const entry of tourDates) {
      if (!entry.date || !entry.venue || !entry.city) {
        return res.status(400).json({
          success: false,
          message: 'Each tour date must have date, venue, and city',
        });
      }
    }

    try {
      await writeTourDates(tourDates);
      return res.status(200).json({ success: true, tourDates });
    } catch (error) {
      console.error('Error saving tour dates:', error);
      return res.status(500).json({ success: false, message: 'Failed to save tour dates' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
