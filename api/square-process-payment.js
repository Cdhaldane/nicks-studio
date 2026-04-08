/**
 * Process a payment
 * POST /api/square-process-payment
 */
const { getSquareClient, getLocationId, sendJSON } = require('./_utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sourceId, amount, currency, verificationToken } = req.body;
    const squareClient = getSquareClient();
    const locationId = getLocationId();

    const response = await squareClient.payments.create({
      sourceId,
      idempotencyKey: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amountMoney: {
        amount: BigInt(amount),
        currency: currency || 'USD',
      },
      locationId,
      verificationToken,
    });

    sendJSON(res, response);
  } catch (error) {
    console.error('Error processing payment:', error);
    sendJSON(
      res,
      {
        error: 'Failed to process payment',
        message: error.message,
        details: error.errors,
      },
      500
    );
  }
};
