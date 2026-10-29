/**
 * Public Booking Request Submission
 * POST /api/booking-request  { name, email, eventDate, venue, city, budget, message, eventType }
 *
 * Stores the request for the admin Bookings tab and emails the owner
 * (BOOKING_NOTIFY_EMAILS, else ORDER_NOTIFY_EMAILS) with Reply-To set to the
 * requester, so answering is one tap.
 */
const { readPrivateJson, writePrivateJson } = require('./_private-blob');
const { fromAddress, sendOne } = require('./_resend');
const { renderBookingNotification } = require('./_booking-notification');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Shared with the booking-requests resource in api/_admin-handlers.js.
const BLOB_PATHNAME = 'admin/booking-requests.json';

// Per-field length caps so a bad/automated submission can't bloat the blob.
const MAX = { name: 200, email: 200, eventDate: 30, venue: 200, city: 200, budget: 100, eventType: 50, message: 5000 };
const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/**
 * A repeat from the same address inside this window is stored but not
 * emailed — a double-submit or a simple spam loop shouldn't flood the inbox or
 * burn the Resend daily quota the newsletter shares.
 */
const ALERT_COOLDOWN_MS = 60 * 60 * 1000;

const recipients = () =>
  (process.env.BOOKING_NOTIFY_EMAILS || process.env.ORDER_NOTIFY_EMAILS || '')
    .split(',')
    .map((address) => address.trim())
    .filter((address) => EMAIL_RE.test(address));

const recentlyRequested = (requests, email) =>
  requests.some(
    (r) => r.email === email && Date.now() - new Date(r.createdAt).getTime() < ALERT_COOLDOWN_MS
  );

/**
 * Emails the owner about one request. Never throws: the request is already
 * saved, and a failed alert is not the person booking's problem.
 */
async function sendAlert(request) {
  const to = recipients();
  if (to.length === 0) {
    console.error('Booking alert skipped: BOOKING_NOTIFY_EMAILS / ORDER_NOTIFY_EMAILS is empty or invalid');
    return;
  }
  try {
    const { subject, html, text } = renderBookingNotification(request);
    await sendOne(
      { from: fromAddress(), to, subject, html, text, reply_to: request.email },
      { idempotencyKey: `booking-${request.id}` }
    );
  } catch (error) {
    console.error(`Failed to send booking alert for ${request.id}:`, error.message);
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};

  // Honeypot: a hidden field real users never see. If it's filled, a bot did it —
  // report success but store nothing, so the bot can't tell it was rejected.
  if (body.company) {
    return res.status(201).json({ success: true, message: 'Booking request submitted successfully' });
  }

  const name = clean(body.name, MAX.name);
  const email = clean(body.email, MAX.email).toLowerCase();
  const message = clean(body.message, MAX.message);

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
  }

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }

  let requests;
  try {
    // Throws rather than returning [] on a failed read — saving on top of an
    // empty list would wipe every earlier request.
    requests = await readPrivateJson(BLOB_PATHNAME, []);
  } catch (error) {
    console.error('Booking request read failed:', error.message);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }

  const newRequest = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name,
    email,
    eventDate: clean(body.eventDate, MAX.eventDate) || null,
    venue: clean(body.venue, MAX.venue),
    city: clean(body.city, MAX.city),
    budget: clean(body.budget, MAX.budget),
    message,
    eventType: clean(body.eventType, MAX.eventType) || 'private',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const isRepeat = recentlyRequested(requests, email);

  try {
    await writePrivateJson(BLOB_PATHNAME, [newRequest, ...requests]);
  } catch (error) {
    console.error('Booking request save failed:', error.message);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }

  if (isRepeat) {
    console.warn(`Booking alert skipped for ${newRequest.id}: same address within the last hour`);
  } else {
    await sendAlert(newRequest);
  }

  return res.status(201).json({ success: true, message: 'Booking request submitted successfully' });
};
