/**
 * Newsletter actions — subscribe, import, campaign sending and unsubscribe.
 *
 * Sending model: a campaign is queued with a snapshot of its recipients, then
 * drained in daily instalments capped by NEWSLETTER_DAILY_LIMIT. This keeps the
 * send inside Resend's free-tier 100/day ceiling; raising the limit (on a paid
 * plan) makes the very first drain deliver everything at once.
 */
const crypto = require('crypto');

const { createUnsubscribeToken, readUnsubscribeToken } = require('./_auth');
const {
  SITE_URL,
  escapeHtml,
  renderCampaignHtml,
  renderCampaignText,
} = require('./_email-template');
const {
  readSubscribers,
  writeSubscribers,
  activeSubscribers,
  readCampaignState,
  writeCampaignState,
  usedToday,
  recordUsage,
} = require('./_newsletter-store');
const { BATCH_SIZE, fromAddress, replyToAddress, sendBatch, sendOne } = require('./_resend');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_IMPORT = 5000;
const MAX_FIELD_LEN = 200;
const MAX_SUBJECT_LEN = 200;
const MAX_BODY_LEN = 20000;
const MAX_STORED_FAILURES = 25;

/** One verification copy per instalment; a long drip shouldn't grow unbounded. */
const MAX_STORED_VERIFICATIONS = 30;

/** Consecutive failed drains before a campaign stops retrying. */
const MAX_DRAIN_FAILURES = 3;

/** Spacing between batch calls — Resend allows 10 req/s, this stays well under. */
const BATCH_SPACING_MS = 350;

/**
 * Sends held back from campaigns each day, so a test send and the verification
 * copy always fit inside the provider's ceiling no matter how the drip lands.
 */
const DAILY_RESERVE = 5;

/** Where a copy of every campaign goes, so the send can be eyeballed for real. */
const DEFAULT_VERIFY_ADDRESS = 'xcdhaldane@gmail.com';

/** The provider's hard ceiling for the day — Resend's free tier allows 100. */
const dailyLimit = () => {
  const configured = Number(process.env.NEWSLETTER_DAILY_LIMIT);
  return Number.isFinite(configured) && configured > 0 ? configured : 100;
};

/**
 * What a campaign may consume in a day. Sits below `dailyLimit()` by
 * DAILY_RESERVE so there is always headroom left for test sends — and it scales
 * with the ceiling, so raising NEWSLETTER_DAILY_LIMIT on a paid plan still works.
 */
const campaignDailyLimit = () => {
  const configured = Number(process.env.NEWSLETTER_CAMPAIGN_DAILY_LIMIT);
  if (Number.isFinite(configured) && configured > 0) return Math.min(configured, dailyLimit());
  return Math.max(1, dailyLimit() - DAILY_RESERVE);
};

/** Empty string disables the verification copy entirely. */
const verifyAddress = () => {
  const configured = process.env.NEWSLETTER_VERIFY_ADDRESS;
  const address = (configured === undefined ? DEFAULT_VERIFY_ADDRESS : configured).trim();
  return EMAIL_RE.test(address) ? address.toLowerCase() : null;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sanitizeField = (value) =>
  typeof value === 'string' ? value.trim().slice(0, MAX_FIELD_LEN) : '';

const makeSubscriber = (fields, source) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  email: fields.email,
  ...(fields.name ? { name: fields.name } : {}),
  ...(fields.phone ? { phone: fields.phone } : {}),
  source,
  status: 'active',
  subscribed_at: new Date().toISOString(),
});

const unsubscribeUrlFor = (email) =>
  `${SITE_URL}/api/newsletter?action=unsubscribe&token=${encodeURIComponent(
    createUnsubscribeToken(email)
  )}`;

/** Builds one fully-formed Resend message for a single recipient. */
const buildMessage = ({ email, subject, body }) => {
  const unsubscribeUrl = unsubscribeUrlFor(email);
  return {
    from: fromAddress(),
    to: [email],
    subject,
    html: renderCampaignHtml({ subject, body, unsubscribeUrl }),
    text: renderCampaignText({ subject, body, unsubscribeUrl }),
    reply_to: replyToAddress(),
    headers: {
      // RFC 8058 one-click opt-out — required by Gmail/Yahoo for bulk senders.
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
};

/** Validates composer input shared by test sends and real campaigns. */
const validateContent = ({ subject, body }) => {
  const cleanSubject = typeof subject === 'string' ? subject.trim() : '';
  const cleanBody = typeof body === 'string' ? body.trim() : '';

  if (!cleanSubject) return { error: 'A subject line is required.' };
  if (cleanSubject.length > MAX_SUBJECT_LEN) {
    return { error: `Subject must be under ${MAX_SUBJECT_LEN} characters.` };
  }
  if (!cleanBody) return { error: 'The message body is required.' };
  if (cleanBody.length > MAX_BODY_LEN) {
    return { error: `Message must be under ${MAX_BODY_LEN} characters.` };
  }
  return { subject: cleanSubject, body: cleanBody };
};

/**
 * One message per person, whatever the stored list looks like.
 *
 * Subscribe and import both normalise case and reject repeats, so new rows are
 * clean — but rows predating that can still hold `Fan@Example.com` alongside
 * `fan@example.com`, and `remove` only ever matched the lowercase form. A
 * campaign therefore never trusts the list: it collapses case variants and
 * duplicates before a single message is built.
 */
const uniqueRecipients = (subscribers) => [
  ...new Set(activeSubscribers(subscribers).map((s) => s.email.trim().toLowerCase())),
];

/** Addresses already mailed, as `{ email, at }`. Absent on pre-tracking campaigns. */
const sentLog = (campaign) => (Array.isArray(campaign.sent) ? campaign.sent : []);

const pendingList = (campaign) => (Array.isArray(campaign.pending) ? campaign.pending : []);

/**
 * Pruned campaigns no longer carry their queue, so the outstanding figure has to
 * come from the counts instead of the (now empty) list.
 */
const pendingCountOf = (campaign) =>
  campaign.recipientsPruned
    ? Math.max(0, campaign.totalRecipients - campaign.sentCount)
    : pendingList(campaign).length;

const publicCampaign = (campaign) => ({
  id: campaign.id,
  subject: campaign.subject,
  status: campaign.status,
  createdAt: campaign.createdAt,
  completedAt: campaign.completedAt || null,
  lastRunAt: campaign.lastRunAt || null,
  totalRecipients: campaign.totalRecipients,
  sentCount: campaign.sentCount,
  failedCount: campaign.failures ? campaign.failures.length : 0,
  pendingCount: pendingCountOf(campaign),
  lastError: campaign.lastError || null,
  // Whether ?action=recipients can still itemise this campaign.
  recipientsPruned: Boolean(campaign.recipientsPruned),
  // One per instalment, oldest first — proof each day's batch went out.
  verifications: campaign.verifications || [],
});

/**
 * Sends as much of a campaign as today's remaining quota allows.
 * Pure with respect to storage — returns updated copies for the caller to persist.
 */
async function drainCampaign(campaign, quota) {
  const remainingQuota = campaignDailyLimit() - usedToday(quota);
  if (remainingQuota <= 0) {
    return { campaign, quota, sentNow: 0, reason: 'daily-limit-reached' };
  }
  const queue = pendingList(campaign);
  if (queue.length === 0) {
    return { campaign, quota, sentNow: 0, reason: 'nothing-pending' };
  }

  const targets = queue.slice(0, remainingQuota);
  const sent = [];
  const failures = [];
  let batchError = null;

  for (let offset = 0; offset < targets.length; offset += BATCH_SIZE) {
    const chunk = targets.slice(offset, offset + BATCH_SIZE);
    const messages = chunk.map((email) =>
      buildMessage({ email, subject: campaign.subject, body: campaign.body })
    );

    try {
      // Keyed on campaign + absolute position so a retry replays the same batch.
      await sendBatch(messages, `${campaign.id}-${campaign.sentCount + offset}`);
      sent.push(...chunk);
    } catch (error) {
      console.error(`Campaign ${campaign.id} batch failed:`, error.message);
      batchError = error.message;
      // Leave this chunk pending so the next drain retries it, and stop early
      // rather than burning quota on what looks like a systemic failure.
      break;
    }

    if (offset + BATCH_SIZE < targets.length) await sleep(BATCH_SPACING_MS);
  }

  const sentSet = new Set(sent);
  const pending = queue.filter((email) => !sentSet.has(email));
  const consecutiveFailures = batchError ? (campaign.consecutiveFailures || 0) + 1 : 0;

  const exhausted = consecutiveFailures >= MAX_DRAIN_FAILURES;
  const complete = pending.length === 0;
  const at = new Date().toISOString();

  // Nothing reached a subscriber, so there is nothing to verify — don't spend a
  // send proving the same failure twice.
  const quotaAfterBatch = recordUsage(quota, sent.length);
  const copy =
    sent.length > 0
      ? await sendVerificationCopy(campaign, quotaAfterBatch, sent)
      : { quota: quotaAfterBatch, verification: null };

  const updated = {
    ...campaign,
    pending,
    // Append-only delivery log so the admin panel can show exactly who was
    // mailed on which instalment of the drip.
    sent: [...sentLog(campaign), ...sent.map((email) => ({ email, at }))],
    sentCount: campaign.sentCount + sent.length,
    failures: [...(campaign.failures || []), ...failures].slice(0, MAX_STORED_FAILURES),
    // One entry per instalment that mailed a copy — the audit trail for "did
    // today's drip actually run?".
    verifications: [
      ...(campaign.verifications || []),
      ...(copy.verification ? [copy.verification] : []),
    ].slice(-MAX_STORED_VERIFICATIONS),
    consecutiveFailures,
    lastError: batchError,
    lastRunAt: new Date().toISOString(),
    status: complete ? 'sent' : exhausted ? 'failed' : 'sending',
    ...(complete || exhausted ? { completedAt: new Date().toISOString() } : {}),
  };

  return {
    campaign: updated,
    quota: copy.quota,
    sentNow: sent.length,
    reason: batchError ? 'batch-error' : complete ? 'complete' : 'daily-limit-reached',
  };
}

/**
 * Mails one copy of a campaign to the verification address, identical to what
 * subscribers receive.
 *
 * Sent once per instalment that actually delivers — so a campaign dripped over
 * four days produces four copies, each one proof that day's cron fired. Charged
 * to the reserve rather than the campaign's own allowance, so it never costs a
 * subscriber their place in the day's batch.
 *
 * Never throws: a failed verification copy is worth reporting, not worth
 * derailing a campaign that has already gone out to real people.
 */
async function sendVerificationCopy(campaign, quota, instalment) {
  const address = verifyAddress();
  const skip = (reason) => ({ quota, verification: null, skipped: reason });

  if (!address) return skip('not-configured');
  // In today's batch already — one copy a day is the point, not two.
  if (instalment.includes(address)) return skip('already-in-this-batch');
  if (usedToday(quota) >= dailyLimit()) return skip('daily-limit-reached');

  try {
    await sendOne(
      buildMessage({ email: address, subject: campaign.subject, body: campaign.body }),
      // Keyed on the instalment's start position so a retry replays the same
      // copy, but the next day's copy is a distinct send.
      { idempotencyKey: `verify-${campaign.id}-${campaign.sentCount}` }
    );
    return {
      quota: recordUsage(quota, 1),
      verification: {
        email: address,
        at: new Date().toISOString(),
        instalmentSize: instalment.length,
        error: null,
      },
      skipped: null,
    };
  } catch (error) {
    console.error('Verification copy failed:', error.message);
    return {
      quota,
      verification: {
        email: address,
        at: new Date().toISOString(),
        instalmentSize: instalment.length,
        error: error.message,
      },
      skipped: null,
    };
  }
}

/** The tail of a response message describing this run's verification copy. */
const verificationNote = (campaign, moreToCome) => {
  const latest = (campaign.verifications || []).slice(-1)[0];
  if (!latest) return '';
  if (latest.error) return ` Your verification copy could not be sent: ${latest.error}`;
  return ` A copy was sent to ${latest.email} so you can check it${
    moreToCome ? ', and another follows with each daily batch' : ''
  }.`;
};

/** Finds the oldest campaign still owing sends, or null. */
const nextQueuedCampaign = (campaigns) =>
  [...campaigns]
    .reverse()
    .find(
      (c) => (c.status === 'queued' || c.status === 'sending') && pendingList(c).length > 0
    ) || null;

// ── Handlers ──

/** POST — subscribe a single email from the site footer/popup. */
async function subscribe(req, res) {
  const { email, source = 'website' } = req.body || {};

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }
  const normalizedEmail = email.toLowerCase().trim();

  const subscribers = await readSubscribers();
  const existing = subscribers.find((s) => s.email === normalizedEmail);

  if (existing && (existing.status || 'active') === 'active') {
    return res.status(409).json({ success: false, message: 'Email already subscribed' });
  }

  // Someone who previously opted out is re-activated rather than duplicated.
  if (existing) {
    const updated = subscribers.map((s) =>
      s.email === normalizedEmail
        ? { ...s, status: 'active', resubscribed_at: new Date().toISOString() }
        : s
    );
    await writeSubscribers(updated);
    return res.status(200).json({ success: true, message: 'Welcome back! You are subscribed.' });
  }

  const subscriber = makeSubscriber({ email: normalizedEmail }, source);
  await writeSubscribers([subscriber, ...subscribers]);
  return res.status(200).json({ success: true, message: 'Successfully subscribed!', subscriber });
}

/** POST — bulk import of { name?, phone?, email } rows. */
async function importSubscribers(req, res) {
  const { subscribers: incoming, source = 'import' } = req.body;

  if (incoming.length === 0) {
    return res.status(400).json({ success: false, message: 'No subscribers provided' });
  }
  if (incoming.length > MAX_IMPORT) {
    return res
      .status(400)
      .json({ success: false, message: `Too many rows. Import up to ${MAX_IMPORT} at a time.` });
  }

  const existing = await readSubscribers();
  const knownEmails = new Set(existing.map((s) => s.email));

  let imported = 0;
  let duplicates = 0;
  let invalid = 0;
  const toAdd = [];

  incoming.forEach((entry) => {
    const email = sanitizeField(entry && entry.email).toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      invalid += 1;
      return;
    }
    if (knownEmails.has(email)) {
      duplicates += 1;
      return;
    }
    knownEmails.add(email); // guards against duplicates within the batch too
    toAdd.push(
      makeSubscriber(
        { email, name: sanitizeField(entry.name), phone: sanitizeField(entry.phone) },
        source
      )
    );
    imported += 1;
  });

  if (toAdd.length > 0) {
    await writeSubscribers([...toAdd, ...existing]);
  }

  return res.status(200).json({
    success: true,
    message: `Imported ${imported} new subscriber${imported === 1 ? '' : 's'}.`,
    imported,
    duplicates,
    invalid,
    total: existing.length + imported,
  });
}

/** GET — full subscriber list for the admin panel. */
async function list(req, res) {
  const subscribers = await readSubscribers();
  return res.status(200).json({
    subscribers,
    total: subscribers.length,
    activeTotal: activeSubscribers(subscribers).length,
  });
}

/** DELETE — hard-remove a subscriber. */
async function remove(req, res) {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required' });
  }
  const normalizedEmail = email.toLowerCase().trim();
  const subscribers = await readSubscribers();
  await writeSubscribers(subscribers.filter((s) => s.email !== normalizedEmail));
  return res.status(200).json({ success: true, message: 'Subscriber removed' });
}

/** POST (admin) — send one preview copy to a nominated address. */
async function sendTest(req, res) {
  const { to } = req.body || {};
  if (!to || !EMAIL_RE.test(to)) {
    return res.status(400).json({ success: false, message: 'A valid test address is required.' });
  }

  const content = validateContent(req.body || {});
  if (content.error) {
    return res.status(400).json({ success: false, message: content.error });
  }

  const state = await readCampaignState();
  if (usedToday(state.quota) >= dailyLimit()) {
    return res.status(429).json({
      success: false,
      message: `Daily send limit of ${dailyLimit()} reached. Try again tomorrow.`,
    });
  }

  const testAddress = to.toLowerCase().trim();
  try {
    await sendOne({
      ...buildMessage({ email: testAddress, subject: content.subject, body: content.body }),
      subject: `[TEST] ${content.subject}`,
    });
  } catch (error) {
    console.error('Test send failed:', error.message);
    return res
      .status(502)
      .json({ success: false, message: `Could not send test email. ${error.message}` });
  }

  await writeCampaignState({ ...state, quota: recordUsage(state.quota, 1) });

  return res.status(200).json({ success: true, message: `Test email sent to ${testAddress}.` });
}

/** POST (admin) — queue a campaign to every active subscriber and start sending. */
async function send(req, res) {
  const content = validateContent(req.body || {});
  if (content.error) {
    return res.status(400).json({ success: false, message: content.error });
  }

  const state = await readCampaignState();

  const inFlight = nextQueuedCampaign(state.campaigns);
  if (inFlight) {
    return res.status(409).json({
      success: false,
      message: `"${inFlight.subject}" is still sending (${inFlight.sentCount}/${inFlight.totalRecipients}). Wait for it to finish first.`,
      campaign: publicCampaign(inFlight),
    });
  }

  const recipients = uniqueRecipients(await readSubscribers());
  if (recipients.length === 0) {
    return res.status(400).json({ success: false, message: 'No active subscribers to send to.' });
  }

  const campaign = {
    id: `cmp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    subject: content.subject,
    body: content.body,
    status: 'queued',
    createdAt: new Date().toISOString(),
    totalRecipients: recipients.length,
    pending: recipients,
    sent: [],
    sentCount: 0,
    failures: [],
    consecutiveFailures: 0,
  };

  const result = await drainCampaign(campaign, state.quota);
  const saved = result.campaign;

  await writeCampaignState({
    campaigns: [saved, ...state.campaigns],
    quota: result.quota,
  });

  if (result.sentNow === 0 && result.reason === 'batch-error') {
    return res.status(502).json({
      success: false,
      message: `Sending failed: ${saved.lastError}`,
      campaign: publicCampaign(saved),
    });
  }

  const remaining = saved.pending.length;
  const days = Math.ceil(remaining / campaignDailyLimit());
  const verifyNote = verificationNote(saved, remaining > 0);

  return res.status(200).json({
    success: true,
    message:
      (remaining
        ? `Sent to ${result.sentNow} of ${recipients.length}. The remaining ${remaining} will go out automatically over the next ${days} day${days === 1 ? '' : 's'}.`
        : `Sent to all ${result.sentNow} subscribers.`) + verifyNote,
    campaign: publicCampaign(saved),
  });
}

/** Cron-triggered — sends the next daily instalment of any unfinished campaign. */
async function drain(req, res) {
  const state = await readCampaignState();
  const campaign = nextQueuedCampaign(state.campaigns);

  if (!campaign) {
    return res.status(200).json({ success: true, message: 'No campaigns pending.', sent: 0 });
  }

  const result = await drainCampaign(campaign, state.quota);

  await writeCampaignState({
    campaigns: state.campaigns.map((c) => (c.id === campaign.id ? result.campaign : c)),
    quota: result.quota,
  });

  const stillPending = result.campaign.pending.length;

  return res.status(200).json({
    success: true,
    message:
      `Sent ${result.sentNow} for "${campaign.subject}". ${stillPending} remaining.` +
      verificationNote(result.campaign, stillPending > 0),
    sent: result.sentNow,
    campaign: publicCampaign(result.campaign),
  });
}

/**
 * POST (admin) — renders the composer's text through the real email template.
 *
 * The panel used to approximate the layout itself and got it wrong, showing
 * plain paragraphs for something that ships with links, bold and a branded
 * shell. Rendering server-side means the preview cannot drift from the send.
 */
async function preview(req, res) {
  const content = validateContent(req.body || {});
  if (content.error) {
    return res.status(400).json({ success: false, message: content.error });
  }

  return res.status(200).json({
    success: true,
    html: renderCampaignHtml({
      subject: content.subject,
      body: content.body,
      // Placeholder — a real token is minted per recipient at send time.
      unsubscribeUrl: `${SITE_URL}/api/newsletter?action=unsubscribe&token=preview`,
    }),
    text: renderCampaignText({
      subject: content.subject,
      body: content.body,
      unsubscribeUrl: `${SITE_URL}/api/newsletter?action=unsubscribe&token=preview`,
    }),
  });
}

/** GET (admin) — campaign history for the panel, newest first. */
async function campaigns(req, res) {
  const state = await readCampaignState();
  return res.status(200).json({
    campaigns: state.campaigns.map(publicCampaign),
    quota: {
      limit: dailyLimit(),
      campaignLimit: campaignDailyLimit(),
      usedToday: usedToday(state.quota),
    },
    verifyAddress: verifyAddress(),
  });
}

/**
 * GET (admin) — who has and hasn't been mailed for one campaign.
 *
 * "Sent" means Resend accepted the message, which is not the same as it landing
 * in an inbox; the panel labels it accordingly.
 */
async function campaignRecipients(req, res) {
  const id = typeof req.query.id === 'string' ? req.query.id.trim() : '';
  if (!id) {
    return res.status(400).json({ success: false, message: 'A campaign id is required.' });
  }

  const state = await readCampaignState();
  const campaign = state.campaigns.find((c) => c.id === id);
  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campaign not found.' });
  }

  const sent = sentLog(campaign)
    .filter((entry) => entry && entry.email)
    .map((entry) => ({ email: entry.email, at: entry.at || null }));

  const failed = (campaign.failures || [])
    .filter((entry) => entry && entry.email)
    .map((entry) => ({ email: entry.email, error: entry.error || null }));

  return res.status(200).json({
    success: true,
    campaign: publicCampaign(campaign),
    sent,
    pending: [...pendingList(campaign)],
    failed,
    // Campaigns queued before delivery logging existed, and ones whose detail has
    // aged out, report counts but cannot itemise. The panel says so rather than
    // rendering an empty list as "nobody".
    sentListComplete: !campaign.recipientsPruned && sent.length === campaign.sentCount,
    pendingListComplete: !campaign.recipientsPruned,
  });
}

const unsubscribePage = (title, message) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#0a0a0a;color:#f3f3f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:15vh auto;padding:32px;text-align:center;background:#141414;border:1px solid #262626;border-radius:12px;">
    <h1 style="font-size:20px;margin:0 0 12px;">${escapeHtml(title)}</h1>
    <p style="color:#8a8a8a;line-height:1.6;margin:0 0 24px;">${escapeHtml(message)}</p>
    <a href="${SITE_URL}" style="color:#ddc036;text-decoration:none;font-size:14px;">← Back to nickolamagnolia.com</a>
  </div>
</body></html>`;

/**
 * GET  — human-facing opt-out page.
 * POST — RFC 8058 one-click endpoint; mail clients expect a bare 200.
 */
async function unsubscribe(req, res) {
  const token = req.query.token;
  const email = readUnsubscribeToken(token);
  const oneClick = req.method === 'POST';

  if (!email) {
    if (oneClick) return res.status(400).end();
    return res
      .status(400)
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .send(
        unsubscribePage(
          'Invalid unsubscribe link',
          'This link is not valid. It may have been altered or truncated by your email client.'
        )
      );
  }

  const subscribers = await readSubscribers();
  const isKnown = subscribers.some((s) => s.email === email);

  if (isKnown) {
    const updated = subscribers.map((s) =>
      s.email === email
        ? { ...s, status: 'unsubscribed', unsubscribed_at: new Date().toISOString() }
        : s
    );
    await writeSubscribers(updated);
  }

  if (oneClick) return res.status(200).end();

  return res
    .status(200)
    .setHeader('Content-Type', 'text/html; charset=utf-8')
    .send(
      unsubscribePage(
        'You have been unsubscribed',
        `${email} will no longer receive emails from ${SITE_URL.replace(/^https?:\/\//, '')}. Sorry to see you go.`
      )
    );
}

module.exports = {
  subscribe,
  importSubscribers,
  list,
  remove,
  sendTest,
  send,
  drain,
  campaigns,
  campaignRecipients,
  preview,
  unsubscribe,
};
