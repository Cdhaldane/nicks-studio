/**
 * Square action handlers — backing logic for the consolidated /api/square function.
 *
 * Each export is an async (req, res) handler for one Square operation. api/square.js
 * dispatches to these based on the ?action= query param. They live in a single
 * _-prefixed module (Vercel does not turn _-prefixed files into functions) so the
 * whole Square surface costs one Serverless Function instead of nine.
 *
 * Behavior is preserved verbatim from the original square-*.js endpoints.
 */
const { getSquareClient, getLocationId, sendJSON } = require('./_utils');

/* ── List catalog items (with image URLs) ── */
async function catalogItems(req, res) {
  try {
    const squareClient = getSquareClient();
    const response = await squareClient.catalog.list({ types: 'ITEM' });

    const items = [];
    for await (const item of response) {
      items.push(item);
    }

    const imageIds = items.flatMap((item) => item.itemData?.imageIds || []).filter(Boolean);

    let images = {};
    if (imageIds.length > 0) {
      const imageResponse = await squareClient.catalog.batchGet({ objectIds: imageIds });
      images = (imageResponse.objects || []).reduce((acc, img) => {
        acc[img.id] = img.imageData?.url;
        return acc;
      }, {});
    }

    const itemsWithImages = items.map((item) => ({
      ...item,
      itemData: {
        ...item.itemData,
        images: (item.itemData?.imageIds || []).map((id) => ({ id, url: images[id] })),
      },
    }));

    sendJSON(res, { objects: itemsWithImages });
  } catch (error) {
    console.error('Error fetching catalog:', error);
    sendJSON(res, { error: 'Failed to fetch catalog', message: error.message }, 500);
  }
}

/* ── Get a single catalog item ── */
async function catalogItem(req, res) {
  try {
    const { id } = req.query;
    if (!id) return sendJSON(res, { error: 'Item ID is required' }, 400);

    const squareClient = getSquareClient();
    const response = await squareClient.catalog.get({ objectId: id, includeRelatedObjects: true });
    sendJSON(res, response);
  } catch (error) {
    console.error('Error fetching item:', error);
    sendJSON(res, { error: 'Failed to fetch item', message: error.message }, 500);
  }
}

/* ── Get items by category ── */
async function catalogCategory(req, res) {
  try {
    const { id } = req.query;
    if (!id) return sendJSON(res, { error: 'Category ID is required' }, 400);

    const squareClient = getSquareClient();
    const response = await squareClient.catalog.searchItems({ categoryIds: [id] });
    sendJSON(res, { objects: response.items || [] });
  } catch (error) {
    console.error('Error fetching category:', error);
    sendJSON(res, { error: 'Failed to fetch category', message: error.message }, 500);
  }
}

/* ── Redirect to a catalog image URL ── */
async function catalogImage(req, res) {
  try {
    const { id } = req.query;
    if (!id) return sendJSON(res, { error: 'Image ID is required' }, 400);

    const squareClient = getSquareClient();
    const response = await squareClient.catalog.get({ objectId: id });
    const imageUrl = response.object?.imageData?.url;

    if (imageUrl) {
      res.redirect(imageUrl);
    } else {
      sendJSON(res, { error: 'Image not found' }, 404);
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    sendJSON(res, { error: 'Failed to fetch image', message: error.message }, 500);
  }
}

/* ── Create a checkout session ── */
async function checkout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { lineItems, redirectUrl } = req.body;
    const squareClient = getSquareClient();
    const locationId = getLocationId();

    const orderResponse = await squareClient.orders.create({
      order: {
        locationId,
        lineItems: lineItems.map((item) => ({
          catalogObjectId: item.catalogObjectId,
          quantity: String(item.quantity),
        })),
      },
      idempotencyKey: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    const checkoutResponse = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: `checkout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: {
        locationId,
        lineItems: lineItems.map((item) => ({
          catalogObjectId: item.catalogObjectId,
          quantity: String(item.quantity),
        })),
      },
      checkoutOptions: {
        redirectUrl: redirectUrl || `${process.env.FRONTEND_URL}/order-confirmation`,
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
      { error: 'Failed to create checkout', message: error.message, details: error.errors },
      500
    );
  }
}

/* ── Create a payment link ── */
async function paymentLink(req, res) {
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
          ? { name: lineItems[0].name, priceMoney: lineItems[0].basePriceMoney, locationId }
          : undefined,
      order:
        lineItems.length > 1
          ? {
              locationId,
              lineItems: lineItems.map((item) => ({
                name: item.name,
                quantity: String(item.quantity),
                basePriceMoney: item.basePriceMoney,
              })),
            }
          : undefined,
      checkoutOptions: {
        redirectUrl:
          checkoutOptions?.redirectUrl || `${process.env.FRONTEND_URL}/order-confirmation`,
        askForShippingAddress: checkoutOptions?.askForShippingAddress ?? true,
      },
    });

    sendJSON(res, response);
  } catch (error) {
    console.error('Error creating payment link:', error);
    sendJSON(
      res,
      { error: 'Failed to create payment link', message: error.message, details: error.errors },
      500
    );
  }
}

/* ── Process a payment ── */
async function processPayment(req, res) {
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
      amountMoney: { amount: BigInt(amount), currency: currency || 'USD' },
      locationId,
      verificationToken,
    });

    sendJSON(res, response);
  } catch (error) {
    console.error('Error processing payment:', error);
    sendJSON(
      res,
      { error: 'Failed to process payment', message: error.message, details: error.errors },
      500
    );
  }
}

/* ── Get a single order ── */
async function order(req, res) {
  try {
    const { id } = req.query;
    if (!id) return sendJSON(res, { error: 'Order ID is required' }, 400);

    const squareClient = getSquareClient();
    const response = await squareClient.orders.get({ orderId: id });
    sendJSON(res, response);
  } catch (error) {
    console.error('Error fetching order:', error);
    sendJSON(res, { error: 'Failed to fetch order', message: error.message }, 500);
  }
}

/* ── List recent orders (merch dashboard) ── */
async function orders(req, res) {
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
            createdAt: { startAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
          },
        },
      },
      limit,
    });

    const mapped = (response.orders || []).map((o) => ({
      id: o.id,
      state: o.state,
      totalMoney: o.totalMoney,
      lineItems: (o.lineItems || []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        totalMoney: item.totalMoney,
      })),
      createdAt: o.createdAt,
      fulfillments: (o.fulfillments || []).map((f) => ({ type: f.type, state: f.state })),
    }));

    sendJSON(res, { orders: mapped, count: mapped.length });
  } catch (error) {
    console.error('Error fetching orders:', error);
    sendJSON(res, { orders: [], count: 0, error: error.message }, 200);
  }
}

module.exports = {
  'catalog-items': catalogItems,
  'catalog-item': catalogItem,
  'catalog-category': catalogCategory,
  'catalog-image': catalogImage,
  checkout,
  'payment-link': paymentLink,
  'process-payment': processPayment,
  order,
  orders,
};
