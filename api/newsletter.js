/**
 * Newsletter (consolidated endpoint)
 *
 * Dispatches on ?action= where present, falling back to the original
 * method-based routes so the public subscribe form keeps working unchanged.
 * Everything lives in one Serverless Function to stay under the Hobby
 * plan's 12-function limit.
 *
 *   Public
 *     POST   /api/newsletter                       { email, source? }     subscribe
 *     POST   /api/newsletter                       { subscribers: [...] } bulk import
 *     GET    /api/newsletter                                              list all
 *     DELETE /api/newsletter                       { email }              remove one
 *     GET    /api/newsletter?action=unsubscribe&token=…                   opt-out page
 *     POST   /api/newsletter?action=unsubscribe&token=…                   one-click opt-out
 *
 *   Admin (Bearer session token from /api/admin?resource=login)
 *     POST   /api/newsletter?action=test           { to, subject, body }  send one test
 *     POST   /api/newsletter?action=send           { subject, body }      queue campaign
 *     GET    /api/newsletter?action=campaigns                             history + quota
 *     GET    /api/newsletter?action=recipients&id=…                       who was mailed
 *     POST   /api/newsletter?action=preview        { subject, body }      render the email
 *
 *   Cron (Bearer CRON_SECRET)
 *     POST   /api/newsletter?action=drain                                 send daily instalment
 */
const { requireAdmin, isCronRequest } = require('./_auth');
const handlers = require('./_newsletter-handlers');

/** Actions callable only with a valid admin session token. */
const ADMIN_ACTIONS = {
  test: { method: 'POST', handler: handlers.sendTest },
  send: { method: 'POST', handler: handlers.send },
  campaigns: { method: 'GET', handler: handlers.campaigns },
  recipients: { method: 'GET', handler: handlers.campaignRecipients },
  preview: { method: 'POST', handler: handlers.preview },
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action;

  try {
    // Recipient-facing opt-out. Public by design — the signed token is the auth.
    if (action === 'unsubscribe') {
      if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return await handlers.unsubscribe(req, res);
    }

    // Daily instalment, triggered by Vercel Cron.
    if (action === 'drain') {
      if (!isCronRequest(req)) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
      }
      return await handlers.drain(req, res);
    }

    if (action && Object.prototype.hasOwnProperty.call(ADMIN_ACTIONS, action)) {
      const route = ADMIN_ACTIONS[action];
      if (req.method !== route.method) {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      if (!requireAdmin(req, res)) return undefined;
      return await route.handler(req, res);
    }

    if (action) {
      return res.status(404).json({ error: `Unknown newsletter action: ${action}` });
    }

    // ── Legacy method-based routes ──

    if (req.method === 'POST' && Array.isArray((req.body || {}).subscribers)) {
      return await handlers.importSubscribers(req, res);
    }
    if (req.method === 'POST') return await handlers.subscribe(req, res);
    if (req.method === 'GET') return await handlers.list(req, res);
    if (req.method === 'DELETE') return await handlers.remove(req, res);

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`Newsletter action "${action || req.method}" failed:`, error);
    if (res.headersSent) return undefined;
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};
