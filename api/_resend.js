/**
 * Minimal Resend REST client.
 *
 * Uses global fetch rather than the `resend` SDK so the serverless bundle picks
 * up no new dependency — this project installs api/ deps separately from the CRA
 * root and adding one there is a deploy risk for no real gain.
 */

const API_BASE = 'https://api.resend.com';
const USER_AGENT = 'nickolamagnolia-newsletter/1.0'; // Resend 403s requests without one.

/** Resend caps a single batch call at 100 messages. */
const BATCH_SIZE = 100;

const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 800;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const apiKey = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not configured');
  return key;
};

/** The verified sender. Falls back to Resend's shared test domain for local dev. */
const fromAddress = () =>
  process.env.NEWSLETTER_FROM || 'Nickola Magnolia <onboarding@resend.dev>';

const replyToAddress = () => process.env.NEWSLETTER_REPLY_TO || undefined;

const isRetryable = (status) => status === 429 || status >= 500;

/**
 * POSTs to Resend, retrying rate limits and transient server errors with backoff.
 * Throws a descriptive Error on non-retryable failures or exhausted attempts.
 */
async function request(path, body, { idempotencyKey } = {}) {
  const headers = {
    Authorization: `Bearer ${apiKey()}`,
    'Content-Type': 'application/json',
    'User-Agent': USER_AGENT,
  };
  // Guards against a retry — or an impatient double-click — sending twice.
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey.slice(0, 256);

  let lastError = 'Unknown error';
  let lastStatus = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    } catch (networkError) {
      lastError = `Network error: ${networkError.message}`;
      if (attempt === MAX_ATTEMPTS) break;
      await sleep(RETRY_BASE_MS * attempt);
      continue;
    }

    if (response.ok) {
      return response.json();
    }

    const detail = await response.text().catch(() => '');
    lastError = `Resend responded ${response.status}: ${detail.slice(0, 300)}`;
    lastStatus = response.status;

    if (!isRetryable(response.status) || attempt === MAX_ATTEMPTS) break;

    // Honour Retry-After when Resend supplies it, otherwise back off linearly.
    const retryAfter = Number(response.headers.get('retry-after'));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : RETRY_BASE_MS * attempt);
  }

  // Callers key off `status` to tell a duplicate idempotent send from a real failure.
  const error = new Error(lastError);
  error.status = lastStatus;
  throw error;
}

/**
 * Sends up to BATCH_SIZE messages in one call.
 * @param {Array<object>} messages Fully-formed Resend email objects.
 * @param {string} idempotencyKey  Stable per-batch key so retries can't duplicate.
 */
async function sendBatch(messages, idempotencyKey) {
  if (messages.length === 0) return { data: [] };
  if (messages.length > BATCH_SIZE) {
    throw new Error(`Batch of ${messages.length} exceeds the ${BATCH_SIZE} message limit`);
  }
  return request('/emails/batch', messages, { idempotencyKey });
}

/**
 * Sends a single message — test sends and order alerts.
 * @param {object} message  A fully-formed Resend email object.
 * @param {object} [options]
 * @param {string} [options.idempotencyKey] Stable key so a repeated trigger can't duplicate.
 */
const sendOne = (message, options = {}) => request('/emails', message, options);

module.exports = {
  BATCH_SIZE,
  fromAddress,
  replyToAddress,
  sendBatch,
  sendOne,
};
