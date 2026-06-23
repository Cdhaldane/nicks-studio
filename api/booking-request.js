/**
 * Public Booking Request Submission
 * POST /api/booking-request  { name, email, eventDate, venue, city, budget, message, eventType }
 */
const { head, put } = require('@vercel/blob');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, eventDate, venue, city, budget, message, eventType } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
  }

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }

  const requests = await readRequests();
  const newRequest = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    eventDate: eventDate || null,
    venue: venue || '',
    city: city || '',
    budget: budget || '',
    message: message.trim(),
    eventType: eventType || 'private',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  requests.unshift(newRequest);
  await writeRequests(requests);

  return res.status(201).json({ success: true, message: 'Booking request submitted successfully' });
};
