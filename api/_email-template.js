/**
 * Renders the branded newsletter shell around plain text typed in the admin panel.
 *
 * The client never writes HTML — they type a message, we escape it and wrap it in
 * a table-based dark layout that survives Outlook, Gmail and Apple Mail.
 */

const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://nickolamagnolia.com';
const ARTIST_NAME = 'Nickola Magnolia';

const COLORS = {
  page: '#0a0a0a',
  card: '#141414',
  text: '#f3f3f3',
  muted: '#8a8a8a',
  accent: '#ddc036',
  border: '#262626',
};

const SOCIAL_LINKS = [
  { label: 'Instagram', url: 'https://instagram.com/nickolamagnolia' },
  { label: 'Spotify', url: 'https://open.spotify.com/artist/nickolamagnolia' },
  { label: 'Website', url: SITE_URL },
];

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const URL_RE = /(https?:\/\/[^\s<]+)/g;

/**
 * The small formatting vocabulary the admin panel supports. Deliberately tiny —
 * the client types prose, not markup, and everything here degrades to readable
 * plain text in the text/plain alternative.
 *
 *   **bold**              → <strong>
 *   [label](https://…)    → a link showing `label` instead of the raw URL
 *   a line that is only a link → a centred call-to-action button
 *   https://… on its own  → auto-linked, as before
 */
const BOLD_RE = /\*\*(.+?)\*\*/g;
const MD_LINK_RE = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
const BUTTON_BLOCK_RE = /^\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)$/;

/** Only http(s) becomes a link — blocks `javascript:` and friends. */
const SAFE_URL_RE = /^https?:\/\//i;

const anchorHtml = (url, label) =>
  `<a href="${url}" style="color:${COLORS.accent};text-decoration:underline;">${label}</a>`;

/** Table-wrapped so Outlook renders the background; padding lives on the anchor. */
const buttonHtml = (url, label) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px auto 22px;">
  <tr>
    <td align="center" style="background-color:${COLORS.accent};border-radius:6px;">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 30px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:${COLORS.page};text-decoration:none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;

/**
 * Escapes, then applies the inline vocabulary.
 *
 * Finished anchors are parked behind placeholders before the bare-URL pass runs,
 * otherwise it would find the `href` of a link it had just built and nest a
 * second anchor inside it.
 */
const renderInline = (raw) => {
  const parked = [];
  const park = (html) => `\u0000${parked.push(html) - 1}\u0000`;

  const html = escapeHtml(raw)
    .replace(BOLD_RE, '<strong>$1</strong>')
    .replace(MD_LINK_RE, (match, label, url) =>
      SAFE_URL_RE.test(url) ? park(anchorHtml(url, label)) : match
    )
    .replace(URL_RE, (url) => park(anchorHtml(url, url)));

  return html.replace(/\u0000(\d+)\u0000/g, (_, index) => parked[Number(index)]);
};

/**
 * Splits on blank lines into paragraphs, preserving single newlines as <br>.
 * Escaping happens before formatting so user text can never inject markup.
 */
const renderBody = (body) =>
  String(body)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const asButton = block.match(BUTTON_BLOCK_RE);
      if (asButton) return buttonHtml(asButton[2], asButton[1]);

      const html = renderInline(block).replace(/\n/g, '<br />');
      return `<p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:${COLORS.text};">${html}</p>`;
    })
    .join('\n');

/** Strips the formatting markers for the text/plain alternative and preheader. */
const toPlainText = (body) =>
  String(body)
    .replace(BOLD_RE, '$1')
    .replace(MD_LINK_RE, (match, label, url) =>
      SAFE_URL_RE.test(url) ? `${label}: ${url}` : match
    );

/** First ~110 chars of the body, shown as inbox preview text next to the subject. */
const buildPreheader = (body) => {
  const flat = toPlainText(body).replace(/\s+/g, ' ').trim();
  return escapeHtml(flat.length > 110 ? `${flat.slice(0, 107)}...` : flat);
};

const renderSocial = () =>
  SOCIAL_LINKS.map(
    (link) =>
      `<a href="${link.url}" style="color:${COLORS.muted};text-decoration:none;font-size:13px;padding:0 8px;">${link.label}</a>`
  ).join(`<span style="color:${COLORS.border};">|</span>`);

/**
 * Builds the full HTML email.
 * @param {object} params
 * @param {string} params.subject       Subject line, reused as the visible heading.
 * @param {string} params.body          Plain text as typed by the admin.
 * @param {string} params.unsubscribeUrl Per-recipient one-click opt-out link.
 */
const renderCampaignHtml = ({ subject, body, unsubscribeUrl }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="dark light" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${buildPreheader(body)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.page};padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:${COLORS.card};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;">

        <tr>
          <td align="center" style="padding:32px 32px 8px;">
            <a href="${SITE_URL}" style="text-decoration:none;color:${COLORS.text};font-size:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">${ARTIST_NAME}</a>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px;">
            <div style="height:1px;background-color:${COLORS.border};margin:16px 0 24px;"></div>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px;">
            <h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;color:${COLORS.text};font-weight:700;">${escapeHtml(subject)}</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            ${renderBody(body)}
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px 32px;">
            <div style="height:1px;background-color:${COLORS.border};margin-bottom:20px;"></div>
            <p style="margin:0 0 12px;text-align:center;">${renderSocial()}</p>
            <p style="margin:0;text-align:center;font-size:12px;line-height:1.6;color:${COLORS.muted};">
              You're receiving this because you subscribed at ${escapeHtml(SITE_URL.replace(/^https?:\/\//, ''))}.<br />
              <a href="${unsubscribeUrl}" style="color:${COLORS.muted};text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

/** Plain-text alternative. Improves deliverability and serves text-only clients. */
const renderCampaignText = ({ subject, body, unsubscribeUrl }) =>
  [
    ARTIST_NAME.toUpperCase(),
    '',
    subject,
    '',
    toPlainText(body).trim(),
    '',
    '—',
    `You're receiving this because you subscribed at ${SITE_URL}.`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');

module.exports = {
  SITE_URL,
  ARTIST_NAME,
  escapeHtml,
  renderCampaignHtml,
  renderCampaignText,
};
