/**
 * Renders the "new order" alert sent to the shop owner when an order is placed.
 *
 * Deliberately plain and light — this is an operational email read on a phone while
 * packing an order, not marketing. Every value is read back from Square rather than
 * taken from the request that triggered it, so it can't be used to inject content.
 *
 * Amounts are formatted as two-decimal currency, which holds for the USD/CAD/GBP-style
 * currencies Square uses here. A zero-decimal currency (JPY) would need its own case.
 */

const { escapeHtml, SITE_URL, ARTIST_NAME } = require('./_email-template');

const COLORS = {
  page: '#f4f4f2',
  card: '#ffffff',
  text: '#1a1a1a',
  muted: '#6b6b6b',
  accent: '#7a6410',
  rule: '#ddc036',
  border: '#e4e4e1',
};

/** Square returns money as minor units, sometimes as a BigInt. */
const formatMoney = (money) => {
  if (!money || money.amount === undefined || money.amount === null) return null;
  const currency = money.currency || 'USD';
  const value = Number(money.amount) / 100;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  } catch (error) {
    return `${value.toFixed(2)} ${currency}`;
  }
};

const formatMoneyOrDash = (money) => formatMoney(money) || '—';

/** Square timestamps are RFC 3339; show them in the shop's own timezone. */
const formatTimestamp = (isoString, timeZone) => {
  if (!isoString) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timeZone || 'America/New_York',
    }).format(new Date(isoString));
  } catch (error) {
    return isoString;
  }
};

const formatAddress = (address) => {
  if (!address) return [];
  return [
    address.addressLine1,
    address.addressLine2,
    address.addressLine3,
    [address.locality, address.administrativeDistrictLevel1, address.postalCode]
      .filter(Boolean)
      .join(', '),
    address.country && address.country !== 'US' ? address.country : null,
  ].filter(Boolean);
};

/** Pulls buyer + shipping details from the order's fulfillment, falling back to the payment. */
const extractRecipient = (order, payment) => {
  const fulfillment = (order.fulfillments || [])[0];
  const recipient =
    fulfillment?.shipmentDetails?.recipient ||
    fulfillment?.deliveryDetails?.recipient ||
    fulfillment?.pickupDetails?.recipient ||
    {};

  return {
    name: recipient.displayName || '',
    email: recipient.emailAddress || payment?.buyerEmailAddress || '',
    phone: recipient.phoneNumber || '',
    addressLines: formatAddress(recipient.address),
    fulfillmentType: fulfillment?.type || '',
    note: fulfillment?.shipmentDetails?.shippingNote || '',
  };
};

const lineItemsOf = (order) =>
  (order.lineItems || []).map((item) => ({
    name: [item.name, item.variationName].filter(Boolean).join(' — ') || 'Item',
    quantity: item.quantity || '1',
    total: formatMoneyOrDash(item.totalMoney),
    note: item.note || '',
  }));

/** Only the adjustments that are actually non-zero — an empty tax row is just noise. */
const ADJUSTMENT_ROWS = [
  ['Discounts', 'totalDiscountMoney'],
  ['Tax', 'totalTaxMoney'],
  ['Service charges', 'totalServiceChargeMoney'],
  ['Tip', 'totalTipMoney'],
];

const totalsOf = (order) =>
  ADJUSTMENT_ROWS.map(([label, field]) => [label, order[field]])
    .filter(([, money]) => money && Number(money.amount) > 0)
    .map(([label, money]) => [label, formatMoneyOrDash(money)]);

const itemCountOf = (order) =>
  (order.lineItems || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

const cell = (content, style = '') =>
  `<td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};font-size:15px;color:${COLORS.text};${style}">${content}</td>`;

const renderItemRows = (items) =>
  items
    .map(
      (item) => `<tr>
      ${cell(
        `${escapeHtml(item.name)}${
          item.note
            ? `<div style="font-size:13px;color:${COLORS.muted};margin-top:2px;">${escapeHtml(item.note)}</div>`
            : ''
        }`
      )}
      ${cell(escapeHtml(item.quantity), 'text-align:center;white-space:nowrap;')}
      ${cell(escapeHtml(item.total), 'text-align:right;white-space:nowrap;')}
    </tr>`
    )
    .join('\n');

const renderTotalRows = (totals) =>
  totals
    .map(
      ([label, value]) => `<tr>
      <td style="padding:4px 0;font-size:14px;color:${COLORS.muted};">${escapeHtml(label)}</td>
      <td style="padding:4px 0;font-size:14px;color:${COLORS.text};text-align:right;">${escapeHtml(value)}</td>
    </tr>`
    )
    .join('\n');

const renderDetail = (label, value) =>
  value
    ? `<tr>
      <td style="padding:3px 12px 3px 0;font-size:14px;color:${COLORS.muted};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:3px 0;font-size:14px;color:${COLORS.text};">${value}</td>
    </tr>`
    : '';

/**
 * Builds the merchant-facing order alert.
 *
 * @param {object} params
 * @param {object} params.order        Order as returned by the Orders API.
 * @param {object} [params.payment]    Matching Payment, when one could be read — it
 *                                     carries the buyer's email and receipt link.
 * @param {string} [params.locationName] Human name of the selling location.
 * @param {string} [params.timeZone]     IANA zone used to render the order time.
 * @returns {{ subject: string, html: string, text: string }}
 */
const renderOrderNotification = ({ order, payment, locationName, timeZone }) => {
  const items = lineItemsOf(order);
  const totals = totalsOf(order);
  const recipient = extractRecipient(order, payment);
  const total = formatMoneyOrDash(order.totalMoney || payment?.amountMoney);
  const itemCount = itemCountOf(order);
  const placedAt = formatTimestamp(order.createdAt || payment?.createdAt, timeZone);
  const receiptUrl = payment?.receiptUrl || '';

  const subject = `New order — ${total}${itemCount ? ` (${itemCount} item${itemCount === 1 ? '' : 's'})` : ''}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
    `${total} from ${recipient.name || recipient.email || 'a customer'}`
  )}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page};padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLORS.card};border:1px solid ${COLORS.border};border-top:3px solid ${COLORS.rule};border-radius:6px;">
  <tr><td style="padding:28px 28px 8px;">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:${COLORS.muted};">${escapeHtml(ARTIST_NAME)}</p>
    <h1 style="margin:0;font-size:24px;line-height:1.25;color:${COLORS.text};font-weight:600;">New order — ${escapeHtml(total)}</h1>
    <p style="margin:6px 0 0;font-size:14px;color:${COLORS.muted};">${escapeHtml(
      [placedAt, locationName].filter(Boolean).join(' · ')
    )}</p>
  </td></tr>

  <tr><td style="padding:16px 28px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <th align="left" style="padding:0 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${COLORS.muted};font-weight:600;">Item</th>
        <th align="center" style="padding:0 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${COLORS.muted};font-weight:600;">Qty</th>
        <th align="right" style="padding:0 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${COLORS.muted};font-weight:600;">Total</th>
      </tr>
      ${renderItemRows(items)}
    </table>
  </td></tr>

  <tr><td style="padding:14px 28px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${renderTotalRows(totals)}
      <tr>
        <td style="padding:8px 0 0;font-size:16px;color:${COLORS.text};font-weight:600;">Total</td>
        <td style="padding:8px 0 0;font-size:16px;color:${COLORS.text};font-weight:600;text-align:right;">${escapeHtml(total)}</td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:22px 28px 0;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${COLORS.muted};font-weight:600;">Customer</p>
    <table role="presentation" cellpadding="0" cellspacing="0">
      ${renderDetail('Name', escapeHtml(recipient.name))}
      ${renderDetail(
        'Email',
        recipient.email
          ? `<a href="mailto:${escapeHtml(recipient.email)}" style="color:${COLORS.accent};">${escapeHtml(recipient.email)}</a>`
          : ''
      )}
      ${renderDetail('Phone', escapeHtml(recipient.phone))}
      ${renderDetail('Fulfillment', escapeHtml(recipient.fulfillmentType))}
      ${renderDetail(
        'Ship to',
        recipient.addressLines.length
          ? recipient.addressLines.map((line) => escapeHtml(line)).join('<br />')
          : ''
      )}
      ${renderDetail('Note', escapeHtml(recipient.note))}
    </table>
  </td></tr>

  <tr><td style="padding:22px 28px 28px;">
    ${
      receiptUrl
        ? `<a href="${escapeHtml(receiptUrl)}" style="display:inline-block;padding:11px 20px;background:${COLORS.text};color:#ffffff;text-decoration:none;border-radius:4px;font-size:14px;font-weight:600;">View Square receipt</a>`
        : ''
    }
    <p style="margin:18px 0 0;font-size:12px;color:${COLORS.muted};">Order ${escapeHtml(order.id || '')} · sent automatically by ${escapeHtml(SITE_URL)}</p>
  </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  const customerLines = [
    recipient.name && `Name: ${recipient.name}`,
    recipient.email && `Email: ${recipient.email}`,
    recipient.phone && `Phone: ${recipient.phone}`,
    recipient.fulfillmentType && `Fulfillment: ${recipient.fulfillmentType}`,
    recipient.addressLines.length && `Ship to: ${recipient.addressLines.join(', ')}`,
    recipient.note && `Note: ${recipient.note}`,
  ].filter(Boolean);

  const text = [
    `NEW ORDER — ${total}`,
    [placedAt, locationName].filter(Boolean).join(' · '),
    '',
    ...items.map((item) => `${item.quantity} x ${item.name}  ${item.total}`),
    '',
    ...totals.map(([label, value]) => `${label}: ${value}`),
    `Total: ${total}`,
    ...(customerLines.length ? ['', 'CUSTOMER', ...customerLines] : []),
    '',
    ...(receiptUrl ? [`Square receipt: ${receiptUrl}`] : []),
    `Order ${order.id || ''}`,
  ].join('\n');

  return { subject, html, text };
};

module.exports = { renderOrderNotification };
