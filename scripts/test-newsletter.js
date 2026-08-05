/**
 * Functional test for the newsletter send pipeline.
 * Mocks Resend and Blob storage, then drives the real handlers.
 */
const path = require('path');
const assert = require('assert');

const API_DIR = require('path').join(__dirname, '..', 'api');

process.env.ADMIN_PASSWORD = 'test-password-123';
process.env.ADMIN_SESSION_SECRET = 'test-secret-abcdefghijklmnopqrstuvwxyz';
process.env.CRON_SECRET = 'test-cron-secret';
process.env.RESEND_API_KEY = 're_test';
process.env.NEWSLETTER_FROM = 'Nickola <news@nickolamagnolia.com>';
process.env.NEWSLETTER_DAILY_LIMIT = '100';
process.env.PUBLIC_SITE_URL = 'https://nickolamagnolia.com';

const resolve = (mod) => require.resolve(path.join(API_DIR, mod));

// ── Mock Resend ──
const sentBatches = [];
/** Survives the `sentBatches` resets, so key uniqueness can be checked across days. */
const singleSendKeys = [];
let failNextBatch = false;
let failNextSingle = false;
require.cache[resolve('_resend.js')] = {
  id: resolve('_resend.js'),
  filename: resolve('_resend.js'),
  loaded: true,
  exports: {
    BATCH_SIZE: 100,
    fromAddress: () => process.env.NEWSLETTER_FROM,
    replyToAddress: () => undefined,
    sendBatch: async (messages, key) => {
      if (failNextBatch) {
        failNextBatch = false;
        throw new Error('Simulated Resend 500');
      }
      sentBatches.push({ count: messages.length, key, messages });
      return { data: messages.map((_, i) => ({ id: `msg_${i}` })) };
    },
    sendOne: async (message, options = {}) => {
      if (failNextSingle) {
        failNextSingle = false;
        throw new Error('Simulated single-send 500');
      }
      sentBatches.push({
        count: 1,
        single: true,
        key: options.idempotencyKey,
        messages: [message],
      });
      if (options.idempotencyKey) singleSendKeys.push(options.idempotencyKey);
      return { id: 'msg_single' };
    },
  },
};

// ── Mock Blob store ──
let subscribers = [];
let campaignState = { campaigns: [], quota: { date: null, used: 0 } };
const realStore = require(resolve('_newsletter-store.js'));
require.cache[resolve('_newsletter-store.js')].exports = {
  ...realStore,
  readSubscribers: async () => subscribers,
  writeSubscribers: async (next) => {
    subscribers = next;
  },
  readCampaignState: async () => campaignState,
  writeCampaignState: async (next) => {
    campaignState = next;
  },
};

const handlers = require(resolve('_newsletter-handlers.js'));
const router = require(resolve('newsletter.js'));
const { createSessionToken, createUnsubscribeToken } = require(resolve('_auth.js'));

// ── Fake req/res ──
const mkRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
  return res;
};

const mkReq = (over = {}) => ({ method: 'GET', query: {}, body: {}, headers: {}, ...over });

const reset = () => {
  sentBatches.length = 0;
  subscribers = Array.from({ length: 300 }, (_, i) => ({
    id: `s${i}`,
    email: `fan${i}@example.com`,
    status: 'active',
    subscribed_at: '2026-01-01T00:00:00.000Z',
  }));
  campaignState = { campaigns: [], quota: { date: null, used: 0 } };
};

let passed = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed += 1;
  } catch (error) {
    console.log(`  FAIL  ${name}\n        ${error.message}`);
    process.exitCode = 1;
  }
};

(async () => {
  console.log('\n── Auth tokens ──');
  const { verifySessionToken, readUnsubscribeToken } = require(resolve('_auth.js'));

  const token = createSessionToken();
  check('valid session token verifies', () => assert.strictEqual(verifySessionToken(token), true));
  check('tampered session token rejected', () =>
    assert.strictEqual(verifySessionToken(token.replace(/.$/, 'X')), false));
  check('garbage token rejected', () => assert.strictEqual(verifySessionToken('nope'), false));
  check('expired token rejected', () =>
    assert.strictEqual(verifySessionToken('1000.deadbeef'), false));

  const unsub = createUnsubscribeToken('Fan1@Example.com');
  check('unsubscribe token round-trips and normalises case', () =>
    assert.strictEqual(readUnsubscribeToken(unsub), 'fan1@example.com'));
  check('unsubscribe token for other email cannot be forged', () => {
    const [, sig] = unsub.split('.');
    const forged = `${Buffer.from('victim@example.com').toString('base64url')}.${sig}`;
    assert.strictEqual(readUnsubscribeToken(forged), null);
  });

  console.log('\n── Template safety ──');
  const { renderCampaignHtml } = require(resolve('_email-template.js'));
  const html = renderCampaignHtml({
    subject: '<script>alert(1)</script>',
    body: 'Hello <img src=x onerror=alert(1)>\n\nVisit https://example.com now',
    unsubscribeUrl: 'https://site/u?token=abc',
  });
  check('subject is escaped', () => assert.ok(!html.includes('<script>alert(1)</script>')));
  check('body html is escaped', () => assert.ok(!html.includes('<img src=x')));
  check('bare urls are linkified', () =>
    assert.ok(html.includes('href="https://example.com"')));
  check('unsubscribe url present', () => assert.ok(html.includes('https://site/u?token=abc')));

  console.log('\n── Body formatting ──');
  const { renderCampaignText: renderText } = require(resolve('_email-template.js'));
  const fmt = (body) => renderCampaignHtml({ subject: 'S', body, unsubscribeUrl: 'https://u' });

  check('**bold** becomes strong', () =>
    assert.ok(fmt('Hello **world** now').includes('Hello <strong>world</strong> now')));
  check('[label](url) links with the label as the visible text', () => {
    const out = fmt('Grab [Reserve Your Seat](https://tickets.example.com/x) today');
    assert.ok(out.includes('>Reserve Your Seat</a>'));
    assert.ok(out.includes('href="https://tickets.example.com/x"'));
    assert.ok(!out.includes('>https://tickets.example.com/x</a>'));
  });
  check('a link alone on a line becomes a button', () => {
    const out = fmt('Intro\n\n[Reserve Your Seat](https://tickets.example.com/x)\n\nOutro');
    assert.ok(/background-color:#ddc036/.test(out));
    assert.ok(out.includes('>Reserve Your Seat</a>'));
  });
  check('bare urls still auto-link, showing the url', () =>
    assert.ok(fmt('See https://example.com/a').includes('>https://example.com/a</a>')));
  check('a labelled link is not double-wrapped by the bare-url pass', () => {
    const out = fmt('[Tickets](https://example.com/a)');
    assert.strictEqual((out.match(/<a href="https:\/\/example\.com\/a"/g) || []).length, 1);
  });
  check('query strings survive escaping', () =>
    assert.ok(fmt('https://e.ca/x?a=1&b=2').includes('href="https://e.ca/x?a=1&amp;b=2"')));
  check('javascript: urls are refused — left as inert text, never an anchor', () => {
    const out = fmt('[Click](javascript:alert(1))');
    assert.ok(!/<a[^>]+href="javascript/i.test(out));
    assert.ok(!/href="[^"]*alert/i.test(out));
    // Still visible to the author as the literal text they typed, so the
    // mistake is obvious in the preview rather than silently dropped.
    assert.ok(out.includes('[Click]'));
  });
  check('data: and vbscript: urls are refused too', () => {
    assert.ok(!/<a[^>]+href="data:/i.test(fmt('[X](data:text/html;base64,PHN2Zz4=)')));
    assert.ok(!/<a[^>]+href="vbscript:/i.test(fmt('[X](vbscript:msgbox)')));
  });
  check('a label cannot smuggle markup', () => {
    const out = fmt('[<img src=x onerror=alert(1)>](https://example.com)');
    assert.ok(!out.includes('<img src=x'));
  });
  check('numbers in prose are untouched by the placeholder pass', () => {
    const out = fmt('Doors at 7 30 pm, 18 seats, 2026 tour');
    assert.ok(out.includes('Doors at 7 30 pm, 18 seats, 2026 tour'));
    assert.ok(!out.includes('undefined'));
  });
  check('the plain-text alternative strips the markers', () => {
    const text = renderText({
      subject: 'S',
      body: 'A **bold** word and [Tickets](https://e.ca/x)',
      unsubscribeUrl: 'https://u',
    });
    assert.ok(text.includes('A bold word'));
    assert.ok(text.includes('Tickets: https://e.ca/x'));
    assert.ok(!text.includes('**'));
  });

  console.log('\n── Router auth gates ──');
  reset();
  let res = mkRes();
  await router(mkReq({ method: 'POST', query: { action: 'send' }, body: { subject: 'x', body: 'y' } }), res);
  check('send without token returns 401', () => assert.strictEqual(res.statusCode, 401));

  res = mkRes();
  await router(mkReq({ method: 'GET', query: { action: 'drain' } }), res);
  check('drain without cron secret returns 401', () => assert.strictEqual(res.statusCode, 401));

  res = mkRes();
  await router(mkReq({ method: 'GET', query: { action: 'bogus' } }), res);
  check('unknown action returns 404', () => assert.strictEqual(res.statusCode, 404));

  console.log('\n── Campaign send: 300 subscribers, 95/day ──');
  reset();
  const authReq = (over) =>
    mkReq({ headers: { authorization: `Bearer ${createSessionToken()}` }, ...over });

  res = mkRes();
  await router(
    authReq({ method: 'POST', query: { action: 'send' }, body: { subject: 'Monthly', body: 'Hi there' } }),
    res
  );
  check('send returns 200', () => assert.strictEqual(res.statusCode, 200));
  check('exactly 95 sent on day 0, not the provider ceiling of 100', () =>
    assert.strictEqual(res.body.campaign.sentCount, 95));
  check('205 left pending', () => assert.strictEqual(res.body.campaign.pendingCount, 205));
  check('one batch call of 95 made', () => {
    assert.strictEqual(sentBatches[0].count, 95);
  });
  check('status is sending', () => assert.strictEqual(res.body.campaign.status, 'sending'));
  check('message explains the drip', () => assert.ok(/next 3 days/.test(res.body.message)));

  console.log('\n── Verification copy ──');
  check('a single extra copy is sent alongside the batch', () => {
    const singles = sentBatches.filter((b) => b.single);
    assert.strictEqual(singles.length, 1);
    assert.deepStrictEqual(singles[0].messages[0].to, ['xcdhaldane@gmail.com']);
  });
  check('the copy is identical to what subscribers get — no [TEST] marker', () => {
    const copy = sentBatches.find((b) => b.single).messages[0];
    assert.strictEqual(copy.subject, 'Monthly');
    assert.ok(copy.headers['List-Unsubscribe']);
  });
  check('the copy is recorded on the campaign', () => {
    assert.strictEqual(res.body.campaign.verifications.length, 1);
    assert.strictEqual(res.body.campaign.verifications[0].email, 'xcdhaldane@gmail.com');
    assert.strictEqual(res.body.campaign.verifications[0].error, null);
    assert.strictEqual(res.body.campaign.verifications[0].instalmentSize, 95);
  });
  check('the send message mentions it', () =>
    assert.ok(/copy was sent to xcdhaldane@gmail\.com/.test(res.body.message)));
  check('it is charged to the reserve, not to a subscriber slot', () => {
    // 95 subscribers + 1 copy = 96 against the provider's 100.
    assert.strictEqual(campaignState.quota.used, 96);
  });
  check('it is not counted as a campaign recipient', () =>
    assert.strictEqual(res.body.campaign.totalRecipients, 300));

  res = mkRes();
  await router(authReq({ method: 'GET', query: { action: 'campaigns' } }), res);
  check('quota reports both the campaign cap and the provider ceiling', () => {
    assert.strictEqual(res.body.quota.campaignLimit, 95);
    assert.strictEqual(res.body.quota.limit, 100);
  });
  check('the verification address is exposed to the admin panel', () =>
    assert.strictEqual(res.body.verifyAddress, 'xcdhaldane@gmail.com'));

  console.log('\n── Per-message correctness ──');
  const sample = sentBatches[0].messages[0];
  check('one recipient per message (no BCC leak)', () => {
    assert.deepStrictEqual(sample.to, ['fan0@example.com']);
    assert.strictEqual(sample.bcc, undefined);
  });
  check('List-Unsubscribe header set', () =>
    assert.ok(sample.headers['List-Unsubscribe'].startsWith('<https://nickolamagnolia.com/api/newsletter?action=unsubscribe')));
  check('one-click post header set', () =>
    assert.strictEqual(sample.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click'));
  check('each recipient gets a unique unsubscribe token', () => {
    const a = sentBatches[0].messages[0].headers['List-Unsubscribe'];
    const b = sentBatches[0].messages[1].headers['List-Unsubscribe'];
    assert.notStrictEqual(a, b);
  });
  check('plain text alternative included', () => assert.ok(sample.text.includes('Unsubscribe:')));

  console.log('\n── Daily quota enforcement ──');
  res = mkRes();
  await router(
    authReq({ method: 'POST', query: { action: 'send' }, body: { subject: 'Second', body: 'Nope' } }),
    res
  );
  check('second campaign blocked while one is in flight', () =>
    assert.strictEqual(res.statusCode, 409));

  sentBatches.length = 0;
  res = mkRes();
  await router(mkReq({ method: 'GET', query: { action: 'drain' }, headers: { authorization: 'Bearer test-cron-secret' } }), res);
  check('same-day drain sends nothing (quota exhausted)', () => {
    assert.strictEqual(res.body.sent, 0);
    assert.strictEqual(sentBatches.length, 0);
  });

  console.log('\n── Next day drain ──');
  const nextDay = () => {
    campaignState = { ...campaignState, quota: { date: '2020-01-01', used: 0 } }; // stale day
  };
  const cronDrain = async () => {
    const out = mkRes();
    await router(
      mkReq({
        method: 'GET',
        query: { action: 'drain' },
        headers: { authorization: 'Bearer test-cron-secret' },
      }),
      out
    );
    return out;
  };

  nextDay();
  sentBatches.length = 0;
  res = await cronDrain();
  check('quota resets on a new day, sends 95 more', () => assert.strictEqual(res.body.sent, 95));
  check('campaign now at 190/300', () =>
    assert.strictEqual(res.body.campaign.sentCount, 190));
  check('each drip instalment sends its own verification copy', () => {
    assert.strictEqual(sentBatches.filter((b) => b.single).length, 1);
    assert.strictEqual(res.body.campaign.verifications.length, 2);
  });
  check('each copy carries a distinct idempotency key so Resend cannot dedupe them', () => {
    assert.strictEqual(singleSendKeys.length, 2);
    assert.strictEqual(new Set(singleSendKeys).size, 2);
  });

  console.log('\n── Failure handling ──');
  nextDay();
  failNextBatch = true;
  res = await cronDrain();
  check('failed batch sends nothing', () => assert.strictEqual(res.body.sent, 0));
  check('failed recipients stay pending for retry', () =>
    assert.strictEqual(res.body.campaign.pendingCount, 110));
  check('error is recorded', () => assert.ok(res.body.campaign.lastError.includes('Simulated')));

  console.log('\n── Remaining drains complete the campaign ──');
  nextDay();
  res = await cronDrain();
  check('retry after the failure sends 95', () => assert.strictEqual(res.body.sent, 95));
  check('campaign at 285/300 and still sending', () => {
    assert.strictEqual(res.body.campaign.sentCount, 285);
    assert.strictEqual(res.body.campaign.status, 'sending');
  });

  nextDay();
  res = await cronDrain();
  check('final drain sends only the last 15', () => assert.strictEqual(res.body.sent, 15));
  check('campaign marked sent', () => assert.strictEqual(res.body.campaign.status, 'sent'));
  check('all 300 delivered', () => assert.strictEqual(res.body.campaign.sentCount, 300));
  check('a 4-day drip produced exactly 4 verification copies', () => {
    assert.strictEqual(res.body.campaign.verifications.length, 4);
    assert.ok(res.body.campaign.verifications.every((v) => v.error === null));
  });
  check('each copy records the size of the batch it accompanied', () =>
    assert.deepStrictEqual(
      res.body.campaign.verifications.map((v) => v.instalmentSize),
      [95, 95, 95, 15]
    ));
  check('the failed day did not produce a copy', () =>
    assert.strictEqual(singleSendKeys.length, 4));
  check('the cron response mentions the copy', () =>
    assert.ok(/copy was sent to xcdhaldane@gmail\.com/.test(res.body.message)));

  console.log('\n── Recipient tracking ──');
  const campaignId = res.body.campaign.id;

  res = mkRes();
  await router(authReq({ method: 'GET', query: { action: 'recipients', id: campaignId } }), res);
  check('recipients returns 200', () => assert.strictEqual(res.statusCode, 200));
  check('every recipient is itemised as sent', () => {
    assert.strictEqual(res.body.sent.length, 300);
    assert.strictEqual(res.body.pending.length, 0);
  });
  check('sent entries carry an address and a timestamp', () => {
    const first = res.body.sent[0];
    assert.strictEqual(first.email, 'fan0@example.com');
    assert.ok(!Number.isNaN(new Date(first.at).getTime()));
  });
  check('sent list is flagged complete', () =>
    assert.strictEqual(res.body.sentListComplete, true));
  check('no duplicate addresses across the three drains', () => {
    const emails = res.body.sent.map((s) => s.email);
    assert.strictEqual(new Set(emails).size, 300);
  });
  check('the failed batch retry did not double-log its recipients', () =>
    assert.strictEqual(res.body.sent.length, res.body.campaign.sentCount));

  res = mkRes();
  await router(authReq({ method: 'GET', query: { action: 'recipients', id: 'cmp_nope' } }), res);
  check('unknown campaign id returns 404', () => assert.strictEqual(res.statusCode, 404));

  res = mkRes();
  await router(authReq({ method: 'GET', query: { action: 'recipients' } }), res);
  check('missing campaign id returns 400', () => assert.strictEqual(res.statusCode, 400));

  res = mkRes();
  await router(mkReq({ method: 'GET', query: { action: 'recipients', id: campaignId } }), res);
  check('recipients without an admin token returns 401', () =>
    assert.strictEqual(res.statusCode, 401));

  console.log('\n── Partway through a drip ──');
  reset();
  res = mkRes();
  await router(
    authReq({ method: 'POST', query: { action: 'send' }, body: { subject: 'Drip', body: 'Hi' } }),
    res
  );
  const dripId = res.body.campaign.id;
  res = mkRes();
  await router(authReq({ method: 'GET', query: { action: 'recipients', id: dripId } }), res);
  check('95 listed as sent, 205 still queued', () => {
    assert.strictEqual(res.body.sent.length, 95);
    assert.strictEqual(res.body.pending.length, 205);
  });
  check('sent and pending are disjoint', () => {
    const sentEmails = new Set(res.body.sent.map((s) => s.email));
    assert.ok(!res.body.pending.some((email) => sentEmails.has(email)));
  });
  check('sent + pending covers the whole audience', () =>
    assert.strictEqual(res.body.sent.length + res.body.pending.length, 300));

  console.log('\n── Legacy campaign without a delivery log ──');
  campaignState = {
    ...campaignState,
    campaigns: [
      {
        id: 'cmp_legacy',
        subject: 'Before tracking',
        status: 'sent',
        createdAt: '2026-01-01T00:00:00.000Z',
        totalRecipients: 42,
        pending: [],
        sentCount: 42,
        failures: [],
      },
      ...campaignState.campaigns,
    ],
  };
  res = mkRes();
  await router(authReq({ method: 'GET', query: { action: 'recipients', id: 'cmp_legacy' } }), res);
  check('legacy campaign responds instead of erroring', () =>
    assert.strictEqual(res.statusCode, 200));
  check('legacy campaign reports its list as incomplete', () => {
    assert.deepStrictEqual(res.body.sent, []);
    assert.strictEqual(res.body.sentListComplete, false);
  });

  console.log('\n── Detail pruning keeps the blob bounded ──');
  const { MAX_DETAILED_CAMPAIGNS, pruneRecipientDetail } = realStore;
  const oldCampaign = (i, over = {}) => ({
    id: `cmp_old_${i}`,
    subject: `Old ${i}`,
    status: 'sent',
    createdAt: '2026-01-01T00:00:00.000Z',
    totalRecipients: 2,
    pending: [],
    sent: [
      { email: `a${i}@example.com`, at: '2026-01-01T00:00:00.000Z' },
      { email: `b${i}@example.com`, at: '2026-01-01T00:00:00.000Z' },
    ],
    sentCount: 2,
    failures: [],
    ...over,
  });

  const prunedList = pruneRecipientDetail(
    Array.from({ length: MAX_DETAILED_CAMPAIGNS + 3 }, (_, i) => oldCampaign(i))
  );
  check('the newest campaigns keep their addresses', () =>
    assert.strictEqual(prunedList[MAX_DETAILED_CAMPAIGNS - 1].sent.length, 2));
  check('campaigns past the cutoff drop their addresses', () => {
    const dropped = prunedList[MAX_DETAILED_CAMPAIGNS];
    assert.deepStrictEqual(dropped.sent, []);
    assert.strictEqual(dropped.recipientsPruned, true);
  });
  check('pruning preserves the counts', () =>
    assert.strictEqual(prunedList[MAX_DETAILED_CAMPAIGNS].sentCount, 2));

  const withUnfinished = pruneRecipientDetail(
    Array.from({ length: MAX_DETAILED_CAMPAIGNS + 2 }, (_, i) =>
      i === MAX_DETAILED_CAMPAIGNS
        ? oldCampaign(i, { status: 'sending', pending: ['still@example.com'], sentCount: 1 })
        : oldCampaign(i)
    )
  );
  check('an unfinished campaign is never pruned out of its queue', () => {
    const stillSending = withUnfinished[MAX_DETAILED_CAMPAIGNS];
    assert.deepStrictEqual(stillSending.pending, ['still@example.com']);
    assert.strictEqual(stillSending.recipientsPruned, undefined);
  });

  campaignState = {
    campaigns: [prunedList[MAX_DETAILED_CAMPAIGNS], ...campaignState.campaigns],
    quota: campaignState.quota,
  };
  res = mkRes();
  await router(
    authReq({ method: 'GET', query: { action: 'recipients', id: `cmp_old_${MAX_DETAILED_CAMPAIGNS}` } }),
    res
  );
  check('a pruned campaign reports incomplete lists rather than "nobody"', () => {
    assert.strictEqual(res.body.sentListComplete, false);
    assert.strictEqual(res.body.pendingListComplete, false);
  });
  check('a pruned campaign still reports its outstanding count from the totals', () =>
    assert.strictEqual(res.body.campaign.pendingCount, 0));

  console.log('\n── Unsubscribe ──');
  const target = 'fan5@example.com';
  res = mkRes();
  await router(
    mkReq({ method: 'GET', query: { action: 'unsubscribe', token: createUnsubscribeToken(target) } }),
    res
  );
  check('GET unsubscribe returns an html page', () => {
    assert.strictEqual(res.statusCode, 200);
    assert.ok(String(res.body).includes('unsubscribed'));
  });
  check('subscriber marked unsubscribed', () => {
    const s = subscribers.find((x) => x.email === target);
    assert.strictEqual(s.status, 'unsubscribed');
  });

  res = mkRes();
  await router(
    mkReq({ method: 'POST', query: { action: 'unsubscribe', token: createUnsubscribeToken('fan6@example.com') } }),
    res
  );
  check('POST one-click returns bare 200', () => {
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.ended, true);
  });

  res = mkRes();
  await router(mkReq({ method: 'GET', query: { action: 'unsubscribe', token: 'forged.token' } }), res);
  check('invalid token returns 400', () => assert.strictEqual(res.statusCode, 400));

  console.log('\n── Unsubscribed users excluded from next send ──');
  campaignState = { campaigns: [], quota: { date: '2020-01-01', used: 0 } };
  sentBatches.length = 0;
  res = mkRes();
  await router(
    authReq({ method: 'POST', query: { action: 'send' }, body: { subject: 'Next', body: 'Hello' } }),
    res
  );
  check('recipient count drops to 298', () =>
    assert.strictEqual(res.body.campaign.totalRecipients, 298));
  check('unsubscribed emails not in batch', () => {
    const all = sentBatches.flatMap((b) => b.messages.map((m) => m.to[0]));
    assert.ok(!all.includes('fan5@example.com'));
    assert.ok(!all.includes('fan6@example.com'));
  });

  console.log('\n── Resubscribe reactivates instead of duplicating ──');
  res = mkRes();
  await router(mkReq({ method: 'POST', body: { email: 'fan5@example.com' } }), res);
  check('resubscribe succeeds', () => assert.strictEqual(res.statusCode, 200));
  check('no duplicate row created', () => {
    const matches = subscribers.filter((s) => s.email === 'fan5@example.com');
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].status, 'active');
  });

  console.log('\n── No subscriber is mailed twice ──');
  reset();
  subscribers = [
    { id: 'd1', email: 'dupe@example.com', status: 'active' },
    { id: 'd2', email: 'Dupe@Example.com', status: 'active' },
    { id: 'd3', email: 'dupe@example.com', status: 'active' },
    { id: 'd4', email: ' spaced@example.com ', status: 'active' },
    { id: 'd5', email: 'unique@example.com', status: 'active' },
  ];
  campaignState = { campaigns: [], quota: { date: '2020-01-01', used: 0 } };
  sentBatches.length = 0;
  res = mkRes();
  await router(
    authReq({ method: 'POST', query: { action: 'send' }, body: { subject: 'Dupes', body: 'Hi' } }),
    res
  );
  check('duplicate and mixed-case rows collapse to one recipient each', () =>
    assert.strictEqual(res.body.campaign.totalRecipients, 3));
  check('exactly one message per address goes to Resend', () => {
    const all = sentBatches
      .filter((b) => !b.single)
      .flatMap((b) => b.messages.map((m) => m.to[0]));
    assert.deepStrictEqual(all.sort(), [
      'dupe@example.com',
      'spaced@example.com',
      'unique@example.com',
    ]);
  });
  const dupeId = res.body.campaign.id;
  res = mkRes();
  await router(authReq({ method: 'GET', query: { action: 'recipients', id: dupeId } }), res);
  check('the delivery log records each address once', () => {
    const emails = res.body.sent.map((s) => s.email);
    assert.strictEqual(emails.length, 3);
    assert.strictEqual(new Set(emails).size, 3);
  });

  console.log('\n── Verification copy edge cases ──');
  const sendCampaign = async (subject) => {
    campaignState = { campaigns: [], quota: { date: '2020-01-01', used: 0 } };
    sentBatches.length = 0;
    const out = mkRes();
    await router(
      authReq({ method: 'POST', query: { action: 'send' }, body: { subject, body: 'Hello' } }),
      out
    );
    return out;
  };

  reset();
  failNextSingle = true;
  res = await sendCampaign('Copy fails');
  check('a failed verification copy does not fail the campaign', () => {
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.campaign.sentCount, 95);
  });
  check('the failure is recorded and surfaced', () => {
    assert.ok(res.body.campaign.verifications[0].error.includes('Simulated'));
    assert.ok(/verification copy could not be sent/.test(res.body.message));
  });
  check('a failed copy is not charged to the quota', () =>
    assert.strictEqual(campaignState.quota.used, 95));

  reset();
  subscribers = [
    { id: 'sv', email: 'xcdhaldane@gmail.com', status: 'active', subscribed_at: '2026-01-01T00:00:00.000Z' },
    ...subscribers.slice(0, 9),
  ];
  res = await sendCampaign('Already subscribed');
  check('no duplicate copy when the address is already a subscriber', () =>
    assert.strictEqual(sentBatches.filter((b) => b.single).length, 0));
  check('they still receive the campaign itself', () => {
    const all = sentBatches.flatMap((b) => b.messages.map((m) => m.to[0]));
    assert.ok(all.includes('xcdhaldane@gmail.com'));
  });
  check('nothing extra is charged to the quota', () =>
    assert.strictEqual(campaignState.quota.used, 10));

  reset();
  process.env.NEWSLETTER_VERIFY_ADDRESS = '';
  res = await sendCampaign('Copy disabled');
  check('an empty NEWSLETTER_VERIFY_ADDRESS turns the copy off', () => {
    assert.strictEqual(sentBatches.filter((b) => b.single).length, 0);
    assert.deepStrictEqual(res.body.campaign.verifications, []);
  });
  check('the send message says nothing about a copy', () =>
    assert.ok(!/copy/i.test(res.body.message)));

  process.env.NEWSLETTER_VERIFY_ADDRESS = 'someone.else@example.com';
  reset();
  res = await sendCampaign('Overridden');
  check('the address is overridable by env var', () => {
    const single = sentBatches.find((b) => b.single);
    assert.deepStrictEqual(single.messages[0].to, ['someone.else@example.com']);
  });
  delete process.env.NEWSLETTER_VERIFY_ADDRESS;

  console.log('\n── Campaign cap scales with the provider ceiling ──');
  process.env.NEWSLETTER_DAILY_LIMIT = '3000';
  reset();
  res = await sendCampaign('Paid plan');
  check('raising NEWSLETTER_DAILY_LIMIT still sends everything in one pass', () => {
    assert.strictEqual(res.body.campaign.sentCount, 300);
    assert.strictEqual(res.body.campaign.status, 'sent');
  });
  process.env.NEWSLETTER_DAILY_LIMIT = '100';

  console.log(`\n${passed} checks passed.\n`);
})();
