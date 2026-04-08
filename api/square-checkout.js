/**
 * Create a checkout session
 * POST /api/square-checkout
 */
const { getSquareClient, getLocationId, sendJSON } = require('./_utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lineItems, redirectUrl } = req.body;
    const squareClient = getSquareClient();
    const locationId = getLocationId();

    // Create an order first
    const orderResponse = await squareClient.orders.create({
      order: {
        locationId,
        lineItems: lineItems.map(item => ({
          catalogObjectId: item.catalogObjectId,
          quantity: String(item.quantity),
        })),
      },
      idempotencyKey: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    // Create payment link
    const checkoutResponse = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: `checkout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: {
        locationId,
        lineItems: lineItems.map(item => ({
          catalogObjectId: item.catalogObjectId,
          quantity: String(item.quantity),
        })),
      },
      checkoutOptions: {
        redirectUrl:
          redirectUrl || `${process.env.FRONTEND_URL}/order-confirmation`,
        askForShippingAddress: true,
      },
    });

    sendJSON(res, {
      checkout: {
        id: checkoutResponse.paymentLink?.id,
        checkout_page_url: checkoutResponse.paymentLink?.url,
        order: orderResponse.order,
      },
      payment_link: checkoutResponse.paymentLink,
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    sendJSON(
      res,
      {
        error: 'Failed to create checkout',
        message: error.message,
        details: error.errors,
      },
      500
    );
  }
};
