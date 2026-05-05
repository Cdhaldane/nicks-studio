/**
 * Newsletter (combined endpoint)
 * POST   /api/newsletter        { email, source? }  → subscribe
 * GET    /api/newsletter                            → list all subscribers
 * DELETE /api/newsletter        { email }           → remove one
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
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: 'application/json',
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST — subscribe
  if (req.method === 'POST') {
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
  }

  // GET — list all
  if (req.method === 'GET') {
    try {
      const subscribers = await readSubscribers();
      return res.status(200).json({ subscribers, total: subscribers.length });
    } catch (error) {
      console.error('Newsletter list error:', error);
      return res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
  }

  // DELETE — remove one
  if (req.method === 'DELETE') {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    try {
      const subscribers = await readSubscribers();
      const updated = subscribers.filter(s => s.email !== normalizedEmail);
      await writeSubscribers(updated);
      return res.status(200).json({ success: true, message: 'Subscriber removed' });
    } catch (error) {
      console.error('Newsletter delete error:', error);
      return res.status(500).json({ success: false, message: 'Failed to remove subscriber' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
