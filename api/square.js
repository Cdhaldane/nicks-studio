/**
 * Square (consolidated endpoint)
 * Routes every Square operation through a single Serverless Function, dispatching
 * on the ?action= query param. Replaces the former api/square-*.js functions to
 * stay within the Hobby plan's 12-function limit.
 *
 *   GET|POST /api/square?action=<name>
 *   actions: catalog-items, catalog-item, catalog-category, catalog-image,
 *            checkout, order, notify-order
 *
 *   notify-order emails the shop owner about a completed sale. The order
 *   confirmation page calls it once Square sends the buyer back from checkout.
 *
 *   There is deliberately no order listing: `order` returns buyer details for
 *   one unguessable order ID, and a list of IDs would expose every customer.
 */
const handlers = require('./_square-handlers');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action;
  const handler = Object.prototype.hasOwnProperty.call(handlers, action) ? handlers[action] : null;
  if (!handler) {
    return res.status(404).json({ error: `Unknown square action: ${action || '(none)'}` });
  }

  return handler(req, res);
};
