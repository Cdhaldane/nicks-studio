/**
 * Blob persistence for documents holding personal data — the subscriber list,
 * campaign recipient lists and booking requests.
 *
 * The store is public: anyone who knows a blob's URL can read it, and the
 * store's hostname is visible in every image URL the site serves. So these
 * documents live at a pathname derived from BLOB_PATH_SECRET, which can't be
 * guessed:
 *
 *   newsletter/subscribers.json → newsletter/subscribers-<32 hex>.json
 *
 * Migration is automatic and one-way. The first read with the secret set copies
 * the document from its old public pathname to the private one, then overwrites
 * the old pathname with a tombstone. Local dev and production share the store,
 * so an environment that later finds a tombstone (no secret, or a different
 * one) throws rather than starting from an empty list — every caller does
 * read-modify-write, and an empty read would overwrite the real data.
 *
 * Reads throw on anything but a genuine "not found" for the same reason: a
 * transient failure that returned [] used to let the next signup wipe the list.
 *
 * Callers always read before they write, which is what triggers the migration.
 */
const crypto = require('crypto');
const path = require('path');
const { head, put, BlobNotFoundError } = require('@vercel/blob');

const token = () => process.env.BLOB_READ_WRITE_TOKEN;

const MOVED_MESSAGE =
  'data moved to a private path; set BLOB_PATH_SECRET to the same value as production';

let warnedNoSecret = false;

/** The pathname a document lives at — its legacy pathname when no secret is set. */
const privatePathname = (pathname) => {
  const secret = process.env.BLOB_PATH_SECRET;
  if (!secret) {
    if (!warnedNoSecret) {
      console.warn(
        'BLOB_PATH_SECRET is not set — subscriber and booking data is stored at guessable public URLs.'
      );
      warnedNoSecret = true;
    }
    return pathname;
  }
  const digest = crypto.createHmac('sha256', secret).update(pathname).digest('hex').slice(0, 32);
  const dir = path.posix.dirname(pathname);
  const base = path.posix.basename(pathname, '.json');
  return `${dir}/${base}-${digest}.json`;
};

const isTombstone = (data) =>
  Boolean(data) && typeof data === 'object' && !Array.isArray(data) && data.moved === true;

const movedError = (pathname) => new Error(`${pathname}: ${MOVED_MESSAGE}`);

/** `{ found: false }` only for a blob that doesn't exist; every other failure throws. */
async function fetchBlob(pathname) {
  let meta;
  try {
    meta = await head(pathname, { token: token() });
  } catch (error) {
    if (error instanceof BlobNotFoundError) return { found: false };
    throw error;
  }
  // Cache-bust: blob URLs are CDN-cached and callers need read-after-write.
  const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Reading ${pathname} failed: HTTP ${res.status}`);
  }
  return { found: true, data: await res.json() };
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

/**
 * Reads a JSON document, returning `fallback` only when it has never existed.
 * @param {string} pathname The document's legacy (public) pathname.
 */
async function readPrivateJson(pathname, fallback) {
  const target = privatePathname(pathname);

  const current = await fetchBlob(target);
  if (current.found) {
    if (isTombstone(current.data)) throw movedError(pathname);
    return current.data;
  }
  // Without a secret the legacy pathname is the only place to look.
  if (target === pathname) return fallback;

  const legacy = await fetchBlob(pathname);
  if (!legacy.found) return fallback;

  if (isTombstone(legacy.data)) {
    // A concurrent request may have just migrated it — look once more before
    // concluding this environment holds the wrong secret.
    const retry = await fetchBlob(target);
    if (retry.found && !isTombstone(retry.data)) return retry.data;
    throw movedError(pathname);
  }

  await writeBlob(target, legacy.data);
  try {
    await writeBlob(pathname, { moved: true, movedAt: new Date().toISOString() });
  } catch (error) {
    // The data is safe at its new pathname; only the public copy lingers.
    console.error(`Migrated ${pathname} but could not tombstone the public copy:`, error.message);
  }
  return legacy.data;
}

/** Writes a JSON document to its private pathname. Read it first — see the header. */
const writePrivateJson = (pathname, data) => writeBlob(privatePathname(pathname), data);

module.exports = {
  privatePathname,
  readPrivateJson,
  writePrivateJson,
};
