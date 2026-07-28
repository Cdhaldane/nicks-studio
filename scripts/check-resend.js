/**
 * Resend preflight check.
 *
 * Verifies the API key works and reports whether the sending domain is
 * verified — the two things that make a campaign fail before it starts.
 * Never prints the key itself.
 *
 *   npm run check:resend
 */
require('dotenv').config({ override: false });

const USER_AGENT = 'nickolamagnolia-newsletter/1.0';

const mask = (key) =>
  key && key.length > 10 ? `${key.slice(0, 6)}…${key.slice(-4)} (${key.length} chars)` : '(unset)';

/** Trim defensively — a stray quote or CR in .env would otherwise look like a bad key. */
const apiKey = () => (process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, '');

const call = async (path, init = {}) => {
  const res = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'User-Agent': USER_AGENT,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const get = (path) => call(path);

/**
 * Confirms the key can actually send.
 *
 * POSTs a deliberately empty payload: Resend authenticates before it validates
 * the body, so a 422 about a missing field proves the key is good. Nothing is
 * sent. This is checked instead of GET /domains because a Sending-access key is
 * forbidden from reading domains and Resend reports that as "API key is
 * invalid" — a misleading false negative.
 */
const probeSendAuth = () => call('/emails', { method: 'POST', body: '{}' });

/** The address in NEWSLETTER_FROM, stripped of any "Display Name <…>" wrapper. */
const senderDomain = () => {
  const from = process.env.NEWSLETTER_FROM || '';
  const match = from.match(/<([^>]+)>/);
  const address = (match ? match[1] : from).trim();
  return address.includes('@') ? address.split('@')[1].toLowerCase() : null;
};

(async () => {
  const key = process.env.RESEND_API_KEY;
  console.log(`\nRESEND_API_KEY   ${mask(key)}`);
  console.log(`NEWSLETTER_FROM  ${process.env.NEWSLETTER_FROM || '(unset)'}`);
  console.log(`Daily limit      ${process.env.NEWSLETTER_DAILY_LIMIT || '100 (default)'}\n`);

  if (!key) {
    console.error('FAIL  RESEND_API_KEY is not set. Add it to .env.\n');
    process.exit(1);
  }

  const auth = await probeSendAuth();

  if (auth.status === 401 || auth.status === 400) {
    console.error('FAIL  Resend rejected the API key for sending.');
    console.error('      Create a new one with Sending access at https://resend.com/api-keys');
    console.error('      then update .env and run:');
    console.error('      vercel env add RESEND_API_KEY production --sensitive --force\n');
    process.exit(1);
  }
  if (auth.status !== 422) {
    console.error(`FAIL  Unexpected ${auth.status} from Resend:`, auth.body, '\n');
    process.exit(1);
  }

  console.log('OK    API key is valid and permitted to send.\n');

  // Best-effort. A Sending-access key cannot read this, which is not a problem.
  const domains = await get('/domains');
  const needed = senderDomain();

  if (domains.status !== 200) {
    console.log('INFO  Cannot read the domain list — this key is scoped to sending only.');
    console.log(`      Confirm "${needed || 'your sending domain'}" shows Verified at`);
    console.log('      https://resend.com/domains before the first real campaign.\n');
    return;
  }

  const list = (domains.body && domains.body.data) || [];
  if (list.length === 0) {
    console.warn('WARN  No domains registered. Sends will only reach your own address via');
    console.warn('      onboarding@resend.dev. Add one at https://resend.com/domains\n');
    process.exit(1);
  }

  console.log('Domains:');
  list.forEach((d) => {
    console.log(`  ${d.status === 'verified' ? 'OK   ' : 'WARN '} ${d.name} — ${d.status}`);
  });
  console.log('');

  const match = list.find((d) => d.name.toLowerCase() === needed);
  if (!needed) {
    console.warn('WARN  NEWSLETTER_FROM is unset or malformed; cannot check the sender domain.\n');
    process.exit(1);
  }
  if (!match) {
    console.error(`FAIL  NEWSLETTER_FROM sends from "${needed}", which is not in Resend.\n`);
    process.exit(1);
  }
  if (match.status !== 'verified') {
    console.error(`FAIL  "${needed}" is ${match.status}, not verified. Finish its DNS records.\n`);
    process.exit(1);
  }

  console.log(`OK    Ready to send from ${needed}.\n`);
})().catch((error) => {
  console.error('\nFAIL  Could not reach Resend:', error.message, '\n');
  process.exit(1);
});
