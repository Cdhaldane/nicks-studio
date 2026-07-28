/**
 * Emails the shop owner when an order is placed on the site.
 *
 * Square's receipt only ever reaches the buyer — the Checkout API has no field for
 * a second recipient — so this is what tells the owner a sale happened. The order
 * confirmation page calls it once Square sends the buyer back from checkout.
 *
 * The request supplies nothing but an order ID. Everything in the email is read
 * back from the Orders API, so a hand-crafted request can't put words in it, and
 * the guards below mean the worst it can do is re-trigger an alert for a genuine
 * recent order that already generated one.
 */

const { getSquareClient, getLocationId, sendJSON } = require('./_utils');
const { fromAddress, replyToAddress, sendOne } = require('./_resend');
const { renderOrderNotification } = require('./_order-notification');

const ORDER_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Orders older than this are refused. Without it, anyone who guessed order IDs
 * could replay her entire sales history into her inbox one email at a time.
 */
const MAX_ORDER_AGE_MS = 24 * 60 * 60 * 1000;

const recipients = () =>
  (process.env.ORDER_NOTIFY_EMAILS || '')
    .split(',')
    .map((address) => address.trim())
    .filter((address) => EMAIL_RE.test(address));

/**
 * A paid order has tenders attached. State alone isn't enough: an order awaiting
 * shipment stays OPEN long after the money has been taken.
 */
const isPaid = (order) =>
  (order.tenders || []).length > 0 || order.state === 'COMPLETED';

const isRecent = (order) => {
  if (!order.createdAt) return false;
  const age = Date.now() - new Date(order.createdAt).getTime();
  return Number.isFinite(age) && age >= 0 && age < MAX_ORDER_AGE_MS;
};

/** Location name makes the alert readable now that she sells from more than one. */
async function locationLabel(squareClient, locationId) {
  try {
    const response = await squareClient.locations.get({ locationId });
    return {
      name: response.location?.name || '',
      timeZone: response.location?.timezone || '',
    };
  } catch (error) {
    console.error('Could not read Square location for order alert:', error.message);
    return { name: '', timeZone: '' };
  }
}

/**
 * The order alone has no buyer email or receipt link — both hang off the payment
 * that settled it. Missing one only costs a couple of rows in the email.
 */
async function paymentFor(squareClient, order) {
  const paymentId = (order.tenders || []).map((tender) => tender.paymentId).find(Boolean);
  if (!paymentId) return null;
  try {
    const response = await squareClient.payments.get({ paymentId });
    return response.payment || null;
  } catch (error) {
    console.error('Could not read Square payment for order alert:', error.message);
    return null;
  }
}

/** Resend rejects a reused key whose payload changed — that only happens on a repeat. */
const isDuplicateSend = (error) => error.status === 409 || error.status === 422;

/**
 * POST /api/square?action=notify-order   { orderId }
 *
 * Always answers 200 once the request itself is well-formed: the buyer is watching
 * this call from the confirmation page and a failure to notify the owner is not
 * their problem. Reasons are logged and returned for debugging.
 */
async function notifyOrder(req, res) {
  if (req.method !== 'POST') {
    return sendJSON(res, { error: 'Method not allowed' }, 405);
  }

  const orderId = (req.body || {}).orderId;
  if (typeof orderId !== 'string' || !ORDER_ID_RE.test(orderId)) {
    return sendJSON(res, { error: 'A valid orderId is required' }, 400);
  }

  const to = recipients();
  if (to.length === 0) {
    console.error('Order alert skipped: ORDER_NOTIFY_EMAILS is empty or invalid');
    return sendJSON(res, { notified: false, reason: 'no recipients configured' });
  }

  try {
    const squareClient = getSquareClient();
    const { order } = await squareClient.orders.get({ orderId });

    if (!order) {
      return sendJSON(res, { notified: false, reason: 'order not found' });
    }
    if (!isPaid(order)) {
      return sendJSON(res, { notified: false, reason: 'order is not paid' });
    }
    if (!isRecent(order)) {
      return sendJSON(res, { notified: false, reason: 'order is not recent' });
    }

    // In-person sales at the other location shouldn't look like website orders.
    // With no location configured we can't tell them apart, so allow it through
    // rather than silently dropping real orders.
    const sellingLocation = getLocationId();
    if (sellingLocation && order.locationId && order.locationId !== sellingLocation) {
      return sendJSON(res, { notified: false, reason: 'order from another location' });
    }

    const [{ name, timeZone }, payment] = await Promise.all([
      locationLabel(squareClient, order.locationId),
      paymentFor(squareClient, order),
    ]);

    const { subject, html, text } = renderOrderNotification({
      order,
      payment,
      locationName: name,
      timeZone,
    });

    // Replying to the alert reaches the customer directly, which is what she'll want.
    const buyerEmail =
      order.fulfillments?.[0]?.shipmentDetails?.recipient?.emailAddress ||
      payment?.buyerEmailAddress;
    const replyTo = EMAIL_RE.test(buyerEmail || '') ? buyerEmail : replyToAddress();

    await sendOne(
      {
        from: fromAddress(),
        to,
        subject,
        html,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      },
      // Refreshing the confirmation page must not send a second copy.
      { idempotencyKey: `square-order-${order.id}` }
    );

    return sendJSON(res, { notified: true, recipients: to.length });
  } catch (error) {
    if (isDuplicateSend(error)) {
      return sendJSON(res, { notified: false, reason: 'already sent for this order' });
    }
    console.error(`Failed to send order alert for ${orderId}:`, error.message);
    return sendJSON(res, { notified: false, reason: 'send failed' });
  }
}

module.exports = { notifyOrder };
