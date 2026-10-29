/**
 * Blob-backed persistence for the newsletter.
 *
 * Two documents, both holding addresses, so both go through _private-blob.js
 * (unguessable pathnames; reads throw rather than return an empty list):
 *   newsletter/subscribers.json — the audience
 *   newsletter/campaigns.json   — campaign queue + the daily send quota ledger
 */
const { readPrivateJson, writePrivateJson } = require('./_private-blob');

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

// ── Subscribers ──

const readSubscribers = () => readPrivateJson(SUBSCRIBERS_PATH, []);
const writeSubscribers = (subscribers) => writePrivateJson(SUBSCRIBERS_PATH, subscribers);

/**
 * Only these receive campaigns. Legacy rows predate the `status` field, so a
 * missing status is treated as active rather than silently dropping them.
 */
const activeSubscribers = (subscribers) =>
  subscribers.filter((s) => s && s.email && (s.status || 'active') === 'active');

// ── Campaigns + quota ──

const emptyState = () => ({ campaigns: [], quota: { date: null, used: 0 } });

async function readCampaignState() {
  const state = await readPrivateJson(CAMPAIGNS_PATH, null);
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
  writePrivateJson(CAMPAIGNS_PATH, {
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
