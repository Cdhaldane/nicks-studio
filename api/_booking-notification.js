/**
 * Renders the "new booking request" alert sent to the owner when someone fills
 * in the site's booking form.
 *
 * Same plain, light layout as the order alert — it's read on a phone between
 * other things. Every value is public form input, so every value is escaped,
 * links included.
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

// Mirrors the options in src/components/BookingForm/BookingForm.jsx.
const EVENT_TYPE_LABELS = {
  private: 'Private event',
  venue: 'Venue / club',
  festival: 'Festival',
  corporate: 'Corporate',
  wedding: 'Wedding',
  other: 'Other',
};

const eventTypeLabel = (type) => EVENT_TYPE_LABELS[type] || type || '';

/** The form sends YYYY-MM-DD; show it as written rather than shifting it through a timezone. */
const formatEventDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return value || '';
  const [, year, month, day] = match.map(Number);
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, day))
  );
};

const renderDetail = (label, value) =>
  value
    ? `<tr>
      <td style="padding:3px 12px 3px 0;font-size:14px;color:${COLORS.muted};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:3px 0;font-size:14px;color:${COLORS.text};">${value}</td>
    </tr>`
    : '';

/**
 * Builds the owner-facing booking alert.
 *
 * @param {object} request A stored booking request (see api/booking-request.js).
 * @returns {{ subject: string, html: string, text: string }}
 */
const renderBookingNotification = (request) => {
  const type = eventTypeLabel(request.eventType);
  const eventDate = formatEventDate(request.eventDate);
  const where = [request.venue, request.city].filter(Boolean).join(', ');

  const subject = `Booking request — ${request.name}${eventDate ? `, ${eventDate}` : ''}`;
  const summary = [type, eventDate, where].filter(Boolean).join(' · ');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
    `${request.name}${summary ? ` — ${summary}` : ''}`
  )}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page};padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLORS.card};border:1px solid ${COLORS.border};border-top:3px solid ${COLORS.rule};border-radius:6px;">
  <tr><td style="padding:28px 28px 8px;">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:${COLORS.muted};">${escapeHtml(ARTIST_NAME)}</p>
    <h1 style="margin:0;font-size:24px;line-height:1.25;color:${COLORS.text};font-weight:600;">New booking request</h1>
    <p style="margin:6px 0 0;font-size:14px;color:${COLORS.muted};">${escapeHtml(summary)}</p>
  </td></tr>

  <tr><td style="padding:18px 28px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0">
      ${renderDetail('Name', escapeHtml(request.name))}
      ${renderDetail(
        'Email',
        `<a href="mailto:${escapeHtml(request.email)}" style="color:${COLORS.accent};">${escapeHtml(request.email)}</a>`
      )}
      ${renderDetail('Event', escapeHtml(type))}
      ${renderDetail('Date', escapeHtml(eventDate))}
      ${renderDetail('Venue', escapeHtml(request.venue))}
      ${renderDetail('City', escapeHtml(request.city))}
      ${renderDetail('Budget', escapeHtml(request.budget))}
    </table>
  </td></tr>

  <tr><td style="padding:20px 28px 0;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${COLORS.muted};font-weight:600;">Message</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:${COLORS.text};white-space:pre-wrap;">${escapeHtml(request.message)}</p>
  </td></tr>

  <tr><td style="padding:22px 28px 28px;">
    <p style="margin:0;font-size:14px;color:${COLORS.text};">Reply to this email to answer ${escapeHtml(request.name)} directly.</p>
    <p style="margin:18px 0 0;font-size:12px;color:${COLORS.muted};">Request ${escapeHtml(request.id)} · also in the admin Bookings tab · sent automatically by ${escapeHtml(SITE_URL)}</p>
  </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  const details = [
    `Name: ${request.name}`,
    `Email: ${request.email}`,
    type && `Event: ${type}`,
    eventDate && `Date: ${eventDate}`,
    request.venue && `Venue: ${request.venue}`,
    request.city && `City: ${request.city}`,
    request.budget && `Budget: ${request.budget}`,
  ].filter(Boolean);

  const text = [
    'NEW BOOKING REQUEST',
    summary,
    '',
    ...details,
    '',
    'MESSAGE',
    request.message,
    '',
    `Reply to this email to answer ${request.name} directly.`,
    `Request ${request.id}`,
  ].join('\n');

  return { subject, html, text };
};

module.exports = { renderBookingNotification };
