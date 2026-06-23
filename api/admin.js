/**
 * Admin (consolidated endpoint)
 * Routes every admin resource through a single Serverless Function, dispatching
 * on the ?resource= query param. Replaces the former api/admin-*.js functions to
 * stay within the Hobby plan's 12-function limit.
 *
 *   GET|PUT|POST|DELETE /api/admin?resource=<name>
 *   resources: links, social, press-kit, tour-dates, setlists,
 *              booking-requests, popup-image
 */
const handlers = require('./_admin-handlers');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const resource = req.query.resource;
  const handler = handlers[resource];
  if (!handler) {
    return res.status(404).json({ error: `Unknown admin resource: ${resource || '(none)'}` });
  }

  try {
    return await handler(req, res);
  } catch (error) {
    console.error(`Admin resource "${resource}" error:`, error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
