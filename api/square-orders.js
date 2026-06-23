/**
 * Square Orders (list recent orders for merch dashboard)
 * GET /api/square-orders?limit=20  → { orders: [...] }
 */
const { getSquareClient, sendJSON, getLocationId } = require('./_utils');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return sendJSON(res, { error: 'Method not allowed' }, 405);
  }

  try {
    const squareClient = getSquareClient();
    const locationId = getLocationId();
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const response = await squareClient.orders.search({
      locationIds: [locationId],
      query: {
        sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
        filter: {
          stateFilter: { states: ['COMPLETED', 'OPEN'] },
          dateTimeFilter: {
            createdAt: {
              startAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
        },
      },
      limit,
    });

    const orders = (response.orders || []).map(order => ({
      id: order.id,
      state: order.state,
      totalMoney: order.totalMoney,
      lineItems: (order.lineItems || []).map(item => ({
        name: item.name,
        quantity: item.quantity,
        totalMoney: item.totalMoney,
      })),
      createdAt: order.createdAt,
      fulfillments: (order.fulfillments || []).map(f => ({
        type: f.type,
        state: f.state,
      })),
    }));

    sendJSON(res, { orders, count: orders.length });
  } catch (error) {
    console.error('Error fetching orders:', error);
    sendJSON(res, { orders: [], count: 0, error: error.message }, 200);
  }
};
