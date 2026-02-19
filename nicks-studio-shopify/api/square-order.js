/**
 * Get order details
 * GET /api/square-order?id={orderId}
 */
const { getSquareClient, sendJSON } = require('./_utils');

module.exports = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return sendJSON(res, { error: 'Order ID is required' }, 400);
    }

    const squareClient = getSquareClient();
    const response = await squareClient.orders.get({ orderId: id });

    sendJSON(res, response);
  } catch (error) {
    console.error('Error fetching order:', error);
    sendJSON(
      res,
      {
        error: 'Failed to fetch order',
        message: error.message,
      },
      500
    );
  }
};
