/**
 * Blob-backed persistence for the newsletter.
 *
 * Two documents:
 *   newsletter/subscribers.json — the audience
 *   newsletter/campaigns.json   — campaign queue + the daily send quota ledger
 */
const { head, put } = require('@vercel/blob');

const SUBSCRIBERS_PATH = 'newsletter/subscribers.json';
const CAMPAIGNS_PATH = 'newsletter/campaigns.json';

/** Keep the stored history bounded — the panel only ever shows recent sends. */
const MAX_CAMPAIGNS = 50;

/**
 * How many campaigns keep their per-recipient address lists. Each list is one
 * entry per subscriber, so the detail is what makes this blob grow; older
 * finished campaigns keep their counts but drop the addresses.
 */
const MAX_DETAILED_CAMPAIGNS = 10;

const token = () => process.env.BLOB_READ_WRITE_TOKEN;

/** Reads a JSON blob, returning `fallback` when it doesn't exist yet. */
async function readBlob(pathname, fallback) {
  try {
    const meta = await head(pathname, { token: token() });
    // Cache-bust: blob URLs are CDN-cached and we need read-after-write here.
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}

async function writeBlob(pathname, data) {
  await put(pathname, JSON.stringify(data), {
    access: 'public',
    allowOverwrite: true,
    addRandomSuffix: false,
    token: token(),
    contentType: 'application/json',
  });
}

// ── Subscribers ──

const readSubscribers = () => readBlob(SUBSCRIBERS_PATH, []);
const writeSubscribers = (subscribers) => writeBlob(SUBSCRIBERS_PATH, subscribers);

/**
 * Only these receive campaigns. Legacy rows predate the `status` field, so a
 * missing status is treated as active rather than silently dropping them.
 */
const activeSubscribers = (subscribers) =>
  subscribers.filter((s) => s && s.email && (s.status || 'active') === 'active');

// ── Campaigns + quota ──

const emptyState = () => ({ campaigns: [], quota: { date: null, used: 0 } });

async function readCampaignState() {
  const state = await readBlob(CAMPAIGNS_PATH, null);
  if (!state || typeof state !== 'object') return emptyState();
  return {
    campaigns: Array.isArray(state.campaigns) ? state.campaigns : [],
    quota:
      state.quota && typeof state.quota === 'object'
        ? { date: state.quota.date || null, used: Number(state.quota.used) || 0 }
        : { date: null, used: 0 },
  };
}

/** A campaign that will never send again — safe to drop its address lists. */
const isFinished = (campaign) => campaign.status === 'sent' || campaign.status === 'failed';

/**
 * Drops the address lists from campaigns past MAX_DETAILED_CAMPAIGNS, leaving a
 * marker so the admin panel can say "detail no longer stored" rather than
 * showing an empty list as though nobody was mailed. Unfinished campaigns are
 * always left intact — their `pending` list is the queue itself.
 */
const pruneRecipientDetail = (campaigns) =>
  campaigns.map((campaign, index) =>
    index >= MAX_DETAILED_CAMPAIGNS && isFinished(campaign) && !campaign.recipientsPruned
      ? { ...campaign, sent: [], pending: [], recipientsPruned: true }
      : campaign
  );

const writeCampaignState = (state) =>
  writeBlob(CAMPAIGNS_PATH, {
    ...state,
    campaigns: pruneRecipientDetail(state.campaigns.slice(0, MAX_CAMPAIGNS)),
  });

/** UTC day key. The quota ledger resets when this changes. */
const todayKey = () => new Date().toISOString().slice(0, 10);

/** Sends already used today, accounting for the ledger rolling over at UTC midnight. */
const usedToday = (quota) => (quota.date === todayKey() ? quota.used : 0);

/** Returns a new quota object with `count` more sends recorded against today. */
const recordUsage = (quota, count) => ({
  date: todayKey(),
  used: usedToday(quota) + count,
});

module.exports = {
  SUBSCRIBERS_PATH,
  CAMPAIGNS_PATH,
  MAX_DETAILED_CAMPAIGNS,
  pruneRecipientDetail,
  readSubscribers,
  writeSubscribers,
  activeSubscribers,
  readCampaignState,
  writeCampaignState,
  todayKey,
  usedToday,
  recordUsage,
};
