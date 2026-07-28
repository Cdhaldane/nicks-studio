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
let failNextBatch = false;
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
    sendOne: async (message) => {
      sentBatches.push({ count: 1, single: true, messages: [message] });
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

  console.log('\n── Campaign send: 300 subscribers, 100/day ──');
  reset();
  const authReq = (over) =>
    mkReq({ headers: { authorization: `Bearer ${createSessionToken()}` }, ...over });

  res = mkRes();
  await router(
    authReq({ method: 'POST', query: { action: 'send' }, body: { subject: 'Monthly', body: 'Hi there' } }),
    res
  );
  check('send returns 200', () => assert.strictEqual(res.statusCode, 200));
  check('exactly 100 sent on day 0', () =>
    assert.strictEqual(res.body.campaign.sentCount, 100));
  check('200 left pending', () => assert.strictEqual(res.body.campaign.pendingCount, 200));
  check('one batch call of 100 made', () => {
    assert.strictEqual(sentBatches.length, 1);
    assert.strictEqual(sentBatches[0].count, 100);
  });
  check('status is sending', () => assert.strictEqual(res.body.campaign.status, 'sending'));
  check('message explains the drip', () => assert.ok(/next 2 days/.test(res.body.message)));

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
  campaignState = { ...campaignState, quota: { date: '2020-01-01', used: 100 } }; // stale day
  sentBatches.length = 0;
  res = mkRes();
  await router(mkReq({ method: 'GET', query: { action: 'drain' }, headers: { authorization: 'Bearer test-cron-secret' } }), res);
  check('quota resets on a new day, sends 100 more', () => assert.strictEqual(res.body.sent, 100));
  check('campaign now at 200/300', () =>
    assert.strictEqual(res.body.campaign.sentCount, 200));

  console.log('\n── Failure handling ──');
  campaignState = { ...campaignState, quota: { date: '2020-01-01', used: 0 } };
  failNextBatch = true;
  res = mkRes();
  await router(mkReq({ method: 'GET', query: { action: 'drain' }, headers: { authorization: 'Bearer test-cron-secret' } }), res);
  check('failed batch sends nothing', () => assert.strictEqual(res.body.sent, 0));
  check('failed recipients stay pending for retry', () =>
    assert.strictEqual(res.body.campaign.pendingCount, 100));
  check('error is recorded', () => assert.ok(res.body.campaign.lastError.includes('Simulated')));

  console.log('\n── Final drain completes campaign ──');
  campaignState = { ...campaignState, quota: { date: '2020-01-01', used: 0 } };
  res = mkRes();
  await router(mkReq({ method: 'GET', query: { action: 'drain' }, headers: { authorization: 'Bearer test-cron-secret' } }), res);
  check('last 100 sent', () => assert.strictEqual(res.body.sent, 100));
  check('campaign marked sent', () => assert.strictEqual(res.body.campaign.status, 'sent'));
  check('all 300 delivered', () => assert.strictEqual(res.body.campaign.sentCount, 300));

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

  console.log(`\n${passed} checks passed.\n`);
})();
