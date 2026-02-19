/**
 * Create a payment link
 * POST /api/square-payment-link
 */
const { getSquareClient, getLocationId, sendJSON } = require('./_utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lineItems, checkoutOptions } = req.body;
    const squareClient = getSquareClient();
    const locationId = getLocationId();

    const response = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      quickPay:
        lineItems.length === 1
          ? {
              name: lineItems[0].name,
              priceMoney: lineItems[0].basePriceMoney,
              locationId,
            }
          : undefined,
      order:
        lineItems.length > 1
          ? {
              locationId,
              lineItems: lineItems.map(item => ({
                name: item.name,
                quantity: String(item.quantity),
                basePriceMoney: item.basePriceMoney,
              })),
            }
          : undefined,
      checkoutOptions: {
        redirectUrl:
          checkoutOptions?.redirectUrl ||
          `${process.env.FRONTEND_URL}/order-confirmation`,
        askForShippingAddress: checkoutOptions?.askForShippingAddress ?? true,
      },
    });

    sendJSON(res, response);
  } catch (error) {
    console.error('Error creating payment link:', error);
    sendJSON(
      res,
      {
        error: 'Failed to create payment link',
        message: error.message,
        details: error.errors,
      },
      500
    );
  }
};
