/**
 * Functional test for api/_private-blob.js — the unguessable-pathname store for
 * subscriber, campaign and booking data, and its one-way migration.
 * Mocks @vercel/blob and fetch with an in-memory store; nothing touches Vercel.
 *
 * Run: node scripts/test-private-blob.js
 */
const path = require('path');
const assert = require('assert');

const API_DIR = path.join(__dirname, '..', 'api');

// ── Mock Blob store ──
class BlobNotFoundError extends Error {}

const blobs = new Map(); // pathname -> JSON text
const writes = [];
let hiddenOnce = new Set(); // pathnames whose next head() reports not-found
let failNextFetch = null; // 'status' | 'network'
let failNextHead = false;

const blobModule = require.resolve('@vercel/blob', { paths: [API_DIR] });
require.cache[blobModule] = {
  id: blobModule,
  filename: blobModule,
  loaded: true,
  exports: {
    BlobNotFoundError,
    head: async (pathname) => {
      if (failNextHead) {
        failNextHead = false;
        throw new Error('Simulated Blob service outage');
      }
      if (hiddenOnce.has(pathname)) {
        hiddenOnce.delete(pathname);
        throw new BlobNotFoundError();
      }
      if (!blobs.has(pathname)) throw new BlobNotFoundError();
      return { url: `https://store.test/${pathname}` };
    },
    put: async (pathname, body, options) => {
      assert.strictEqual(options.access, 'public');
      assert.strictEqual(options.addRandomSuffix, false);
      assert.strictEqual(options.allowOverwrite, true);
      blobs.set(pathname, body);
      writes.push(pathname);
      return { url: `https://store.test/${pathname}` };
    },
  },
};

global.fetch = async (url, options) => {
  assert.ok(/\?t=\d+$/.test(url), 'reads should be cache-busted');
  assert.strictEqual(options.cache, 'no-store');
  if (failNextFetch === 'network') {
    failNextFetch = null;
    throw new Error('Simulated network error');
  }
  if (failNextFetch === 'status') {
    failNextFetch = null;
    return { ok: false, status: 503, json: async () => ({}) };
  }
  const pathname = url.replace('https://store.test/', '').replace(/\?t=\d+$/, '');
  return { ok: true, status: 200, json: async () => JSON.parse(blobs.get(pathname)) };
};

const warnings = [];
console.warn = (...args) => warnings.push(args.join(' '));
console.error = () => {};

const { privatePathname, readPrivateJson, writePrivateJson } = require(path.join(
  API_DIR,
  '_private-blob.js'
));

const LEGACY = 'newsletter/subscribers.json';
const LIST = [{ email: 'fan@example.com', status: 'active' }];

const reset = () => {
  blobs.clear();
  writes.length = 0;
  hiddenOnce = new Set();
  failNextFetch = null;
  failNextHead = false;
};
const read = (pathname) => (blobs.has(pathname) ? JSON.parse(blobs.get(pathname)) : undefined);

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
const rejects = async (promise) => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  return null;
};

(async () => {
  console.log('\n── No secret: behaves exactly as before ──');
  delete process.env.BLOB_PATH_SECRET;
  reset();
  blobs.set(LEGACY, JSON.stringify(LIST));
  check('the pathname is the legacy one', () => assert.strictEqual(privatePathname(LEGACY), LEGACY));
  let data = await readPrivateJson(LEGACY, []);
  check('reads the legacy document', () => assert.deepStrictEqual(data, LIST));
  await writePrivateJson(LEGACY, [...LIST, { email: 'two@example.com' }]);
  check('writes the legacy document', () => assert.deepStrictEqual(writes, [LEGACY]));
  check('warns once that the data is at a guessable URL', () => {
    assert.strictEqual(warnings.filter((w) => /BLOB_PATH_SECRET/.test(w)).length, 1);
  });
  reset();
  data = await readPrivateJson(LEGACY, ['fallback']);
  check('a document that never existed returns the fallback', () =>
    assert.deepStrictEqual(data, ['fallback']));

  console.log('\n── Secret set: first read migrates ──');
  process.env.BLOB_PATH_SECRET = 'test-secret-one';
  reset();
  blobs.set(LEGACY, JSON.stringify(LIST));
  const target = privatePathname(LEGACY);
  check('the private pathname keeps the directory and adds 32 hex', () =>
    assert.ok(/^newsletter\/subscribers-[0-9a-f]{32}\.json$/.test(target), target));
  check('the pathname is stable for the same secret', () =>
    assert.strictEqual(privatePathname(LEGACY), target));
  data = await readPrivateJson(LEGACY, []);
  check('the data is returned', () => assert.deepStrictEqual(data, LIST));
  check('the data now lives at the private pathname', () => assert.deepStrictEqual(read(target), LIST));
  check('the legacy pathname holds only a tombstone', () => {
    const tomb = read(LEGACY);
    assert.strictEqual(tomb.moved, true);
    assert.ok(tomb.movedAt);
    assert.ok(!JSON.stringify(tomb).includes('fan@example.com'));
  });
  check('the private copy is written before the tombstone', () =>
    assert.deepStrictEqual(writes, [target, LEGACY]));

  writes.length = 0;
  data = await readPrivateJson(LEGACY, []);
  check('later reads come straight from the private pathname', () => {
    assert.deepStrictEqual(data, LIST);
    assert.deepStrictEqual(writes, []);
  });
  await writePrivateJson(LEGACY, []);
  check('writes go to the private pathname', () => assert.deepStrictEqual(writes, [target]));

  console.log('\n── Private document present: legacy untouched ──');
  reset();
  blobs.set(target, JSON.stringify(LIST));
  blobs.set(LEGACY, JSON.stringify([{ email: 'stale@example.com' }]));
  data = await readPrivateJson(LEGACY, []);
  check('the private document wins', () => assert.deepStrictEqual(data, LIST));
  check('the legacy document is neither read into it nor rewritten', () => {
    assert.deepStrictEqual(writes, []);
    assert.deepStrictEqual(read(LEGACY), [{ email: 'stale@example.com' }]);
  });

  console.log('\n── A tombstone is never mistaken for an empty list ──');
  reset();
  blobs.set(target, JSON.stringify(LIST));
  blobs.set(LEGACY, JSON.stringify({ moved: true, movedAt: '2026-10-29T00:00:00.000Z' }));
  delete process.env.BLOB_PATH_SECRET;
  let error = await rejects(readPrivateJson(LEGACY, []));
  check('an environment without the secret throws', () => {
    assert.ok(error, 'expected a throw');
    assert.ok(/BLOB_PATH_SECRET/.test(error.message), error.message);
  });
  check('...and writes nothing', () => assert.deepStrictEqual(writes, []));

  process.env.BLOB_PATH_SECRET = 'a-different-secret';
  error = await rejects(readPrivateJson(LEGACY, []));
  check('an environment with a different secret throws', () => {
    assert.ok(error, 'expected a throw');
    assert.ok(/BLOB_PATH_SECRET/.test(error.message), error.message);
  });
  check('...and writes nothing', () => assert.deepStrictEqual(writes, []));

  process.env.BLOB_PATH_SECRET = 'test-secret-one';
  reset();
  blobs.set(target, JSON.stringify(LIST));
  blobs.set(LEGACY, JSON.stringify({ moved: true, movedAt: '2026-10-29T00:00:00.000Z' }));
  hiddenOnce.add(target); // a concurrent request finished migrating mid-read
  data = await readPrivateJson(LEGACY, []);
  check('a migration racing this read is picked up on the second look', () => {
    assert.deepStrictEqual(data, LIST);
    assert.deepStrictEqual(writes, []);
  });

  console.log('\n── Failed reads throw instead of returning the fallback ──');
  reset();
  blobs.set(target, JSON.stringify(LIST));
  failNextFetch = 'status';
  error = await rejects(readPrivateJson(LEGACY, []));
  check('a non-OK fetch throws', () => assert.ok(error && /503/.test(error.message)));
  failNextFetch = 'network';
  error = await rejects(readPrivateJson(LEGACY, []));
  check('a network error throws', () => assert.ok(error && /network/i.test(error.message)));
  failNextHead = true;
  error = await rejects(readPrivateJson(LEGACY, []));
  check('a Blob service error throws', () => assert.ok(error && /outage/.test(error.message)));
  check('nothing was written by any failed read', () => assert.deepStrictEqual(writes, []));

  reset();
  blobs.set(LEGACY, JSON.stringify(LIST));
  failNextFetch = 'status';
  error = await rejects(readPrivateJson(LEGACY, []));
  check('a failed read of the legacy copy aborts the migration', () => {
    assert.ok(error);
    assert.deepStrictEqual(writes, []);
    assert.deepStrictEqual(read(LEGACY), LIST);
  });

  console.log(`\n${passed} checks passed.\n`);
})();
