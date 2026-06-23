/**
 * Square (consolidated endpoint)
 * Routes every Square operation through a single Serverless Function, dispatching
 * on the ?action= query param. Replaces the former api/square-*.js functions to
 * stay within the Hobby plan's 12-function limit.
 *
 *   GET|POST /api/square?action=<name>
 *   actions: catalog-items, catalog-item, catalog-category, catalog-image,
 *            checkout, payment-link, process-payment, order, orders
 */
const handlers = require('./_square-handlers');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action;
  const handler = handlers[action];
  if (!handler) {
    return res.status(404).json({ error: `Unknown square action: ${action || '(none)'}` });
  }

  return handler(req, res);
};
