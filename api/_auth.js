/**
 * Auth helpers for admin-only and subscriber-facing endpoints.
 *
 * Two independent token types, both stateless HMACs — no session store needed:
 *   - Admin session tokens gate destructive actions (sending a campaign).
 *   - Unsubscribe tokens let a recipient opt out from an email link without
 *     being able to unsubscribe anybody else.
 */
const crypto = require('crypto');

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/** Reads a required secret, failing loudly rather than signing with `undefined`. */
const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
};

const hmac = (secretName, payload) =>
  crypto.createHmac('sha256', requireEnv(secretName)).update(payload).digest('base64url');

/**
 * Compares two strings without leaking their contents through timing.
 * Both sides are hashed first so differing lengths don't throw.
 */
const safeEqual = (a, b) => {
  const digest = (value) => crypto.createHash('sha256').update(String(value)).digest();
  return crypto.timingSafeEqual(digest(a), digest(b));
};

// ── Admin session ──

const verifyAdminPassword = (password) => {
  if (typeof password !== 'string' || password.length === 0) return false;
  return safeEqual(password, requireEnv('ADMIN_PASSWORD'));
};

const createSessionToken = () => {
  const expiresAt = String(Date.now() + SESSION_TTL_MS);
  return `${expiresAt}.${hmac('ADMIN_SESSION_SECRET', expiresAt)}`;
};

const verifySessionToken = (token) => {
  if (typeof token !== 'string') return false;

  const [expiresAt, signature] = token.split('.');
  if (!expiresAt || !signature) return false;

  // Check the signature before trusting the expiry it carries.
  if (!safeEqual(signature, hmac('ADMIN_SESSION_SECRET', expiresAt))) return false;

  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && Date.now() < expiry;
};

/**
 * Express-style guard. Returns true when the caller holds a valid session,
 * otherwise writes a 401 and returns false so the handler can bail out.
 */
const requireAdmin = (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  let authorized = false;
  try {
    authorized = verifySessionToken(token);
  } catch (error) {
    // A missing secret is a server misconfiguration, not a client error.
    console.error('Admin auth check failed:', error.message);
    res.status(500).json({ success: false, message: 'Server auth is not configured.' });
    return false;
  }

  if (!authorized) {
    res.status(401).json({ success: false, message: 'Not authorized. Please log in again.' });
    return false;
  }
  return true;
};

/** Guards the cron-triggered drain endpoint. Vercel sends `Bearer $CRON_SECRET`. */
const isCronRequest = (req) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;
  try {
    return safeEqual(token, requireEnv('CRON_SECRET'));
  } catch {
    return false;
  }
};

// ── Unsubscribe tokens ──

const createUnsubscribeToken = (email) => {
  const normalized = String(email).toLowerCase().trim();
  const encoded = Buffer.from(normalized).toString('base64url');
  return `${encoded}.${hmac('ADMIN_SESSION_SECRET', `unsubscribe:${normalized}`)}`;
};

/** Returns the email the token was minted for, or null if it doesn't verify. */
const readUnsubscribeToken = (token) => {
  if (typeof token !== 'string') return null;

  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  let email;
  try {
    email = Buffer.from(encoded, 'base64url').toString('utf8').toLowerCase().trim();
  } catch {
    return null;
  }
  if (!email) return null;

  try {
    if (!safeEqual(signature, hmac('ADMIN_SESSION_SECRET', `unsubscribe:${email}`))) return null;
  } catch {
    return null;
  }
  return email;
};

module.exports = {
  SESSION_TTL_MS,
  verifyAdminPassword,
  createSessionToken,
  verifySessionToken,
  requireAdmin,
  isCronRequest,
  createUnsubscribeToken,
  readUnsubscribeToken,
};
