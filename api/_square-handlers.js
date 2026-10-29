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
const { notifyOrder } = require('./_order-alert');

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

const MAX_CART_LINES = 50;
const MAX_LINE_QUANTITY = 99;

/**
 * Validates the cart sent by the browser. Only catalog IDs and quantities are
 * accepted — Square prices each line from the catalog, so the buyer can't set
 * what they pay.
 */
const parseLineItems = (lineItems) => {
  if (!Array.isArray(lineItems) || lineItems.length === 0 || lineItems.length > MAX_CART_LINES) {
    return null;
  }
  const parsed = lineItems.map((item) => ({
    catalogObjectId: typeof item?.catalogObjectId === 'string' ? item.catalogObjectId : '',
    quantity: Number(item?.quantity),
  }));
  const valid = parsed.every(
    (item) =>
      item.catalogObjectId &&
      Number.isInteger(item.quantity) &&
      item.quantity >= 1 &&
      item.quantity <= MAX_LINE_QUANTITY
  );
  return valid
    ? parsed.map((item) => ({ ...item, quantity: String(item.quantity) }))
    : null;
};

/* ── Create a checkout session ── */
async function checkout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { redirectUrl } = req.body || {};
  const lineItems = parseLineItems((req.body || {}).lineItems);
  if (!lineItems) {
    return sendJSON(res, { error: 'Invalid cart', message: 'Your cart could not be read.' }, 400);
  }
  try {
    const squareClient = getSquareClient();
    const locationId = getLocationId();

    // The payment link creates its own order; Square appends its ID to the
    // redirect URL, which is how the confirmation page finds it.
    const checkoutResponse = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      order: { locationId, lineItems },
      checkoutOptions: {
        redirectUrl: redirectUrl || `${process.env.FRONTEND_URL}/order-confirmation`,
        askForShippingAddress: true,
      },
    });

    sendJSON(res, {
      checkout: {
        id: checkoutResponse.paymentLink?.id,
        checkout_page_url: checkoutResponse.paymentLink?.url,
        order_id: checkoutResponse.paymentLink?.orderId,
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

module.exports = {
  'catalog-items': catalogItems,
  'catalog-item': catalogItem,
  'catalog-category': catalogCategory,
  'catalog-image': catalogImage,
  checkout,
  order,
  'notify-order': notifyOrder,
};
