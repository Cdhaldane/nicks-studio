/**
 * Newsletter Subscribe
 * POST /api/newsletter-subscribe  { email, source? }
 */
const { head, put } = require('@vercel/blob');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BLOB_PATHNAME = 'newsletter/subscribers.json';

async function readSubscribers() {
  try {
    const meta = await head(BLOB_PATHNAME, { token: process.env.BLOB_READ_WRITE_TOKEN });
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
    return await res.json();
  } catch {
    return [];
  }
}

async function writeSubscribers(subscribers) {
  await put(BLOB_PATHNAME, JSON.stringify(subscribers), {
    access: 'public',
    allowOverwrite: true,
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

  const { email, source = 'website' } = req.body || {};

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const subscribers = await readSubscribers();

    if (subscribers.some(s => s.email === normalizedEmail)) {
      return res.status(409).json({ success: false, message: 'Email already subscribed' });
    }

    const subscriber = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      email: normalizedEmail,
      source,
      status: 'active',
      subscribed_at: new Date().toISOString(),
    };

    await writeSubscribers([subscriber, ...subscribers]);

    return res.status(200).json({ success: true, message: 'Successfully subscribed!', subscriber });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return res.status(500).json({ success: false, message: 'Failed to subscribe. Please try again.' });
  }
};
