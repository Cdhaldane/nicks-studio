/**
 * Functional test for the public booking form endpoint (api/booking-request.js)
 * and the owner alert it sends. Mocks the Blob store and Resend; nothing is
 * stored or emailed for real.
 *
 * Run: node scripts/test-booking-request.js
 */
const path = require('path');
const assert = require('assert');

const API_DIR = path.join(__dirname, '..', 'api');
const resolve = (mod) => require.resolve(path.join(API_DIR, mod));

process.env.BOOKING_NOTIFY_EMAILS = 'owner@example.com, manager@example.com, not-an-email';
process.env.ORDER_NOTIFY_EMAILS = 'orders@example.com';
process.env.NEWSLETTER_FROM = 'Nickola <news@nickolamagnolia.com>';

// ── Mock Blob store ──
let stored = [];
let failNextRead = false;
let writeCount = 0;
require.cache[resolve('_private-blob.js')] = {
  id: resolve('_private-blob.js'),
  filename: resolve('_private-blob.js'),
  loaded: true,
  exports: {
    readPrivateJson: async (pathname, fallback) => {
      assert.strictEqual(pathname, 'admin/booking-requests.json');
      if (failNextRead) {
        failNextRead = false;
        throw new Error('Simulated Blob outage');
      }
      return stored.length ? JSON.parse(JSON.stringify(stored)) : fallback;
    },
    writePrivateJson: async (pathname, data) => {
      assert.strictEqual(pathname, 'admin/booking-requests.json');
      stored = data;
      writeCount += 1;
    },
  },
};

// ── Mock Resend ──
const sent = [];
let failNextSend = false;
require.cache[resolve('_resend.js')] = {
  id: resolve('_resend.js'),
  filename: resolve('_resend.js'),
  loaded: true,
  exports: {
    BATCH_SIZE: 100,
    fromAddress: () => process.env.NEWSLETTER_FROM,
    replyToAddress: () => undefined,
    sendBatch: async () => {
      throw new Error('booking alerts should never batch');
    },
    sendOne: async (message, options = {}) => {
      if (failNextSend) {
        failNextSend = false;
        throw new Error('Simulated Resend 500');
      }
      sent.push({ message, options });
      return { id: 'msg_1' };
    },
  },
};

console.error = () => {};
console.warn = () => {};

const handler = require(resolve('booking-request.js'));

const mkRes = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
  setHeader() {
    return this;
  },
  end() {
    return this;
  },
});

const submit = async (body) => {
  const res = mkRes();
  await handler({ method: 'POST', headers: {}, query: {}, body }, res);
  return res;
};

const reset = () => {
  stored = [];
  sent.length = 0;
  writeCount = 0;
  failNextRead = false;
  failNextSend = false;
};

const VALID = {
  name: 'Sam <script>alert(1)</script>',
  email: 'Sam@Example.com',
  eventDate: '2026-12-31',
  venue: 'The Hall & "Bar"',
  city: 'Cobourg, ON',
  budget: '$1,500',
  eventType: 'wedding',
  message: 'Hi!\n<img src=x onerror=alert(1)> can you play our first dance?',
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
  console.log('\n── A request is stored and the owner is emailed ──');
  reset();
  let res = await submit(VALID);
  check('responds 201', () => assert.strictEqual(res.statusCode, 201));
  check('the request is stored, newest first', () => {
    assert.strictEqual(stored.length, 1);
    assert.strictEqual(stored[0].email, 'sam@example.com');
    assert.strictEqual(stored[0].status, 'pending');
  });
  check('exactly one alert is sent', () => assert.strictEqual(sent.length, 1));
  const { message, options } = sent[0] || { message: {}, options: {} };
  check('it goes to the valid BOOKING_NOTIFY_EMAILS addresses only', () =>
    assert.deepStrictEqual(message.to, ['owner@example.com', 'manager@example.com']));
  check('replying reaches the person booking', () =>
    assert.strictEqual(message.reply_to, 'sam@example.com'));
  check('the idempotency key is per request', () =>
    assert.strictEqual(options.idempotencyKey, `booking-${stored[0].id}`));
  check('every public field is escaped in the HTML', () => {
    assert.ok(!message.html.includes('<script>alert(1)</script>'));
    assert.ok(!message.html.includes('<img src=x'));
    assert.ok(message.html.includes('Sam &lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.ok(message.html.includes('The Hall &amp; &quot;Bar&quot;'));
  });
  check('the alert carries the details the owner needs', () => {
    assert.ok(message.html.includes('Wedding'));
    assert.ok(message.html.includes('Dec 31, 2026'));
    assert.ok(message.html.includes('Cobourg, ON'));
    assert.ok(message.text.includes('can you play our first dance?'));
    assert.ok(message.text.includes('Email: sam@example.com'));
  });

  console.log('\n── Repeats within the hour are stored but not emailed ──');
  res = await submit({ ...VALID, message: 'Sorry, double-clicked' });
  check('the repeat is still saved', () => {
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(stored.length, 2);
  });
  check('no second alert goes out', () => assert.strictEqual(sent.length, 1));
  res = await submit({ ...VALID, email: 'someone.else@example.com' });
  check('a different address still alerts', () => assert.strictEqual(sent.length, 2));
  stored = stored.map((r) =>
    r.email === 'sam@example.com'
      ? { ...r, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
      : r
  );
  res = await submit(VALID);
  check('the same address alerts again after an hour', () => assert.strictEqual(sent.length, 3));

  console.log('\n── Bots and failures ──');
  reset();
  res = await submit({ ...VALID, company: 'Spam Inc' });
  check('a filled honeypot looks successful', () => assert.strictEqual(res.statusCode, 201));
  check('...but stores and sends nothing', () => {
    assert.strictEqual(writeCount, 0);
    assert.strictEqual(sent.length, 0);
  });

  reset();
  failNextSend = true;
  res = await submit(VALID);
  check('a failed alert still returns 201', () => assert.strictEqual(res.statusCode, 201));
  check('...and the request is still saved', () => assert.strictEqual(stored.length, 1));

  reset();
  failNextRead = true;
  res = await submit(VALID);
  check('a failed read returns 500', () => assert.strictEqual(res.statusCode, 500));
  check('...without writing over the list or alerting', () => {
    assert.strictEqual(writeCount, 0);
    assert.strictEqual(sent.length, 0);
  });

  reset();
  res = await submit({ ...VALID, message: '' });
  check('a missing message is rejected', () => assert.strictEqual(res.statusCode, 400));
  res = await submit({ ...VALID, email: 'not-an-email' });
  check('an invalid email is rejected', () => assert.strictEqual(res.statusCode, 400));
  check('...neither is stored nor emailed', () => {
    assert.strictEqual(writeCount, 0);
    assert.strictEqual(sent.length, 0);
  });

  console.log('\n── Recipients ──');
  reset();
  delete process.env.BOOKING_NOTIFY_EMAILS;
  await submit(VALID);
  check('falls back to ORDER_NOTIFY_EMAILS', () =>
    assert.deepStrictEqual(sent[0].message.to, ['orders@example.com']));
  reset();
  delete process.env.ORDER_NOTIFY_EMAILS;
  res = await submit(VALID);
  check('with nobody configured the request is saved and nothing is sent', () => {
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(stored.length, 1);
    assert.strictEqual(sent.length, 0);
  });

  console.log(`\n${passed} checks passed.\n`);
})();
