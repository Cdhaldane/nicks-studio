#!/usr/bin/env node
/**
 * Exercises the order-alert endpoint end to end without touching Square.
 *
 * Drives the real /api/square?action=notify-order handler with a stubbed Square
 * client, so the only thing that can leave the machine is the email — and only
 * when you pass --send.
 *
 *   node scripts/test-order-alert.js            # checks + writes an HTML preview
 *   node scripts/test-order-alert.js --send     # also delivers it through Resend
 */

require('dotenv').config({ override: false });

const fs = require('fs');
const os = require('os');
const path = require('path');

const LOCATION_ID = 'TEST_LOCATION_ID';
const PAYMENT_ID = 'TEST_PAYMENT_ID';

/**
 * Fresh per run. The alert is deduplicated on order id for 24h, so a fixed one
 * would make every --send after the first silently deliver nothing.
 */
const ORDER_ID = `TESTORDER${Date.now().toString(36).toUpperCase()}`;

const shouldSend = process.argv.includes('--send');

// Configure before the handler module reads any of it.
process.env.SQUARE_LOCATION_ID = LOCATION_ID;
if (!process.env.ORDER_NOTIFY_EMAILS) {
  process.env.ORDER_NOTIFY_EMAILS = 'owner@example.com';
}

/** Square timestamps are absolute, so anchor the fixture to "just now". */
const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000).toISOString();

/** A realistic Orders API response — BigInt money, one paid tender, shipping details. */
const baseOrder = () => ({
  id: ORDER_ID,
  locationId: LOCATION_ID,
  state: 'OPEN', // Paid but awaiting shipment — the common case, and not COMPLETED.
  createdAt: minutesAgo(2),
  tenders: [{ id: 'TENDER_1', paymentId: PAYMENT_ID, amountMoney: { amount: 8692n, currency: 'CAD' } }],
  lineItems: [
    {
      name: 'Wildflower Hours',
      variationName: 'Vinyl LP',
      quantity: '1',
      totalMoney: { amount: 3200n, currency: 'CAD' },
    },
    {
      name: 'Tour Tee',
      variationName: 'Medium',
      quantity: '2',
      note: 'gift wrap please',
      totalMoney: { amount: 5000n, currency: 'CAD' },
    },
  ],
  totalTaxMoney: { amount: 492n, currency: 'CAD' },
  totalDiscountMoney: { amount: 0n, currency: 'CAD' },
  totalTipMoney: { amount: 0n, currency: 'CAD' },
  totalMoney: { amount: 8692n, currency: 'CAD' },
  fulfillments: [
    {
      type: 'SHIPMENT',
      state: 'PROPOSED',
      shipmentDetails: {
        recipient: {
          displayName: 'Avery Lin',
          emailAddress: 'avery@example.com',
          phoneNumber: '+15555550123',
          address: {
            addressLine1: '412 Rosewood Ave',
            addressLine2: 'Apt 3',
            locality: 'Halifax',
            administrativeDistrictLevel1: 'NS',
            postalCode: 'B3H 2Y9',
            country: 'CA',
          },
        },
        shippingNote: 'Leave with the neighbour if out',
      },
    },
  ],
});

const FAKE_PAYMENT = {
  id: PAYMENT_ID,
  buyerEmailAddress: 'avery@example.com',
  receiptUrl: 'https://squareup.com/receipt/preview/TEST_PAYMENT_ID',
  amountMoney: { amount: 8692n, currency: 'CAD' },
};

const FAKE_LOCATION = { name: "Nick's", timezone: 'America/Halifax' };

/** Stub the Square client before the handler requires it. */
let currentOrder = baseOrder();
const utils = require('../api/_utils');
utils.getSquareClient = () => ({
  orders: {
    get: async ({ orderId }) => ({ order: orderId === ORDER_ID ? currentOrder : undefined }),
  },
  payments: { get: async () => ({ payment: FAKE_PAYMENT }) },
  locations: { get: async () => ({ location: FAKE_LOCATION }) },
});

const resend = require('../api/_resend');
const captured = [];
const realSendOne = resend.sendOne;
resend.sendOne = async (message, options) => {
  const entry = { message, options };
  captured.push(entry);
  if (!shouldSend) return { id: 'dry-run' };
  // Keep the Resend id so a "did it actually send?" question has an answer later.
  const result = await realSendOne(message, options);
  entry.sentId = result?.id;
  return result;
};

const { notifyOrder } = require('../api/_order-alert');

const buildRequest = (body, method = 'POST') => ({
  method,
  query: { action: 'notify-order' },
  headers: { 'content-type': 'application/json' },
  body,
});

const buildResponse = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.setHeader = () => res;
  res.send = (payload) => {
    res.body = typeof payload === 'string' ? JSON.parse(payload) : payload;
    return res;
  };
  res.json = res.send;
  return res;
};

const run = async (label, req) => {
  const res = buildResponse();
  await notifyOrder(req, res);
  console.log(`  ${label}: ${res.statusCode} ${JSON.stringify(res.body)}`);
  return res;
};

(async () => {
  let failures = 0;
  const check = (name, condition) => {
    console.log(`${condition ? '  PASS' : '  FAIL'}  ${name}`);
    if (!condition) failures += 1;
  };

  console.log('\nRequest validation');
  const wrongMethod = await run('GET instead of POST', buildRequest({ orderId: ORDER_ID }, 'GET'));
  check('rejects a non-POST request', wrongMethod.statusCode === 405);

  const noId = await run('missing orderId', buildRequest({}));
  check('rejects a missing orderId', noId.statusCode === 400);

  const junkId = await run('malformed orderId', buildRequest({ orderId: '../../etc/passwd' }));
  check('rejects a malformed orderId', junkId.statusCode === 400);

  console.log('\nOrder guards');
  currentOrder = { ...baseOrder(), tenders: [], state: 'OPEN' };
  const unpaid = await run('unpaid order', buildRequest({ orderId: ORDER_ID }));
  check('ignores an order with no payment taken', unpaid.body.notified === false);

  currentOrder = { ...baseOrder(), createdAt: minutesAgo(60 * 24 * 9) };
  const stale = await run('nine-day-old order', buildRequest({ orderId: ORDER_ID }));
  check('ignores an order outside the recency window', stale.body.notified === false);

  currentOrder = { ...baseOrder(), locationId: 'OTHER_LOCATION' };
  const elsewhere = await run('other location', buildRequest({ orderId: ORDER_ID }));
  check('ignores an order from another location', elsewhere.body.notified === false);

  check('no email sent by any rejected case', captured.length === 0);

  console.log('\nHappy path');
  currentOrder = baseOrder();
  const ok = await run('paid, recent, right location', buildRequest({ orderId: ORDER_ID }));
  check('accepts a real order', ok.statusCode === 200 && ok.body.notified === true);
  check('sent exactly one email', captured.length === 1);

  if (captured.length === 1) {
    const { message, options } = captured[0];
    check('addressed to ORDER_NOTIFY_EMAILS', Array.isArray(message.to) && message.to.length > 0);
    check('subject shows the order total', message.subject.includes('86.92'));
    check('body lists both items', message.html.includes('Wildflower Hours') && message.html.includes('Tour Tee'));
    check('body shows the shipping address', message.html.includes('412 Rosewood Ave'));
    check('body shows the tax line', message.html.includes('4.92'));
    check('body links the Square receipt', message.html.includes(FAKE_PAYMENT.receiptUrl));
    check('body names the location', message.html.includes("Nick&#39;s") || message.html.includes("Nick's"));
    check('replies go to the buyer', message.reply_to === 'avery@example.com');
    check('idempotency key is per-order', options.idempotencyKey === `square-order-${ORDER_ID}`);
    check('plain-text alternative exists', typeof message.text === 'string' && message.text.includes('NEW ORDER'));

    const preview = path.join(os.tmpdir(), 'square-order-alert-preview.html');
    fs.writeFileSync(preview, message.html);
    console.log(`\n  Subject: ${message.subject}`);
    console.log(`  To:      ${message.to.join(', ')}`);
    console.log(`  Preview: ${preview}`);
  }

  const sentId = captured[0]?.sentId;
  console.log(
    shouldSend
      ? `\n  Sent via Resend. Message id: ${sentId || '(none returned)'}` +
          '\n  Not in the inbox? Check spam — a new sending domain often lands there.'
      : '\n  Dry run — nothing was sent. To actually deliver it:' +
          '\n    npm run test:order-alert -- --send        (goes to ORDER_NOTIFY_EMAILS)' +
          '\n    ORDER_NOTIFY_EMAILS=you@example.com npm run test:order-alert -- --send'
  );

  console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} check(s) failed.\n`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((error) => {
  console.error('\nTest run failed:', error);
  process.exit(1);
});
