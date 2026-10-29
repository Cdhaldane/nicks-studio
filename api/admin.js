/**
 * Admin (consolidated endpoint)
 * Routes every admin resource through a single Serverless Function, dispatching
 * on the ?resource= query param. Replaces the former api/admin-*.js functions to
 * stay within the Hobby plan's 12-function limit.
 *
 *   GET|PUT|POST|DELETE /api/admin?resource=<name>
 *   resources: social, tour-dates, booking-requests, popup-image,
 *              announcement, login, session
 *
 * Everything needs an admin session token except logging in and the reads the
 * public site renders (PUBLIC_READS).
 */
const handlers = require('./_admin-handlers');
const { requireAdmin } = require('./_auth');

/** Resources the public site GETs to render pages. */
const PUBLIC_READS = new Set(['tour-dates', 'announcement', 'social', 'popup-image']);

/** Resources that authenticate themselves. */
const SELF_AUTHENTICATING = new Set(['login', 'session']);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const resource = req.query.resource;
  const handler = Object.prototype.hasOwnProperty.call(handlers, resource)
    ? handlers[resource]
    : null;
  if (!handler) {
    return res.status(404).json({ error: `Unknown admin resource: ${resource || '(none)'}` });
  }

  const isPublic =
    SELF_AUTHENTICATING.has(resource) || (req.method === 'GET' && PUBLIC_READS.has(resource));
  if (!isPublic && !requireAdmin(req, res)) return undefined;

  try {
    return await handler(req, res);
  } catch (error) {
    console.error(`Admin resource "${resource}" error:`, error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
