/**
 * Public Booking Request Submission
 * POST /api/booking-request  { name, email, eventDate, venue, city, budget, message, eventType }
 */
const { head, put } = require('@vercel/blob');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BLOB_PATHNAME = 'admin/booking-requests.json';

// Per-field length caps so a bad/automated submission can't bloat the blob.
const MAX = { name: 200, email: 200, eventDate: 30, venue: 200, city: 200, budget: 100, eventType: 50, message: 5000 };
const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};

  // Honeypot: a hidden field real users never see. If it's filled, a bot did it —
  // report success but store nothing, so the bot can't tell it was rejected.
  if (body.company) {
    return res.status(201).json({ success: true, message: 'Booking request submitted successfully' });
  }

  const name = clean(body.name, MAX.name);
  const email = clean(body.email, MAX.email).toLowerCase();
  const message = clean(body.message, MAX.message);

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
  }

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }

  const requests = await readRequests();
  const newRequest = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name,
    email,
    eventDate: clean(body.eventDate, MAX.eventDate) || null,
    venue: clean(body.venue, MAX.venue),
    city: clean(body.city, MAX.city),
    budget: clean(body.budget, MAX.budget),
    message,
    eventType: clean(body.eventType, MAX.eventType) || 'private',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  requests.unshift(newRequest);
  await writeRequests(requests);

  return res.status(201).json({ success: true, message: 'Booking request submitted successfully' });
};
