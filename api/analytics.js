/**
 * Site Analytics (combined endpoint)
 * POST /api/analytics  { page, referrer }  → record a page view
 * GET  /api/analytics                      → aggregated analytics
 * GET  /api/analytics?raw=true             → raw page views (last 30 days)
 *
 * Privacy-friendly: no cookies, no PII, no fingerprinting.
 */
const { head, put } = require('@vercel/blob');

const BLOB_PATHNAME = 'analytics/page-views.json';
const MAX_ENTRIES = 10000;

async function readPageViews() {
  try {
    const meta = await head(BLOB_PATHNAME, { token: process.env.BLOB_READ_WRITE_TOKEN });
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
    return await res.json();
  } catch {
    return [];
  }
}

async function writePageViews(views) {
  const trimmed = views.slice(-MAX_ENTRIES);
  await put(BLOB_PATHNAME, JSON.stringify(trimmed), {
    access: 'public',
    allowOverwrite: true,
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: 'application/json',
  });
}

function parseReferrerSource(referrer) {
  if (!referrer) return 'direct';
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    if (host.includes('google') || host.includes('bing') || host.includes('yahoo') || host.includes('duckduckgo')) return 'search';
    if (host.includes('facebook') || host.includes('instagram') || host.includes('twitter') || host.includes('tiktok') || host.includes('youtube') || host.includes('linkedin')) return 'social';
    if (host.includes('nickolamagnolia.com')) return 'internal';
    return 'referral';
  } catch {
    return 'direct';
  }
}

function parseDevice(userAgent) {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  return 'desktop';
}

function aggregateData(views) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const externalViews = views.filter(v => v.source !== 'internal');

  const today = externalViews.filter(v => new Date(v.timestamp) >= todayStart);
  const last7d = externalViews.filter(v => new Date(v.timestamp) >= sevenDaysAgo);
  const last30d = externalViews.filter(v => new Date(v.timestamp) >= thirtyDaysAgo);

  // Top pages
  const pageCount = {};
  last30d.forEach(v => { pageCount[v.page] = (pageCount[v.page] || 0) + 1; });
  const topPages = Object.entries(pageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, views]) => ({ page, views }));

  // Traffic sources
  const sourceCount = {};
  last30d.forEach(v => { sourceCount[v.source] = (sourceCount[v.source] || 0) + 1; });
  const sources = Object.entries(sourceCount)
    .sort((a, b) => b[1] - a[1])
    .map(([source, views]) => ({ source, views }));

  // Device breakdown
  const deviceCount = {};
  last30d.forEach(v => { deviceCount[v.device] = (deviceCount[v.device] || 0) + 1; });
  const devices = Object.entries(deviceCount)
    .sort((a, b) => b[1] - a[1])
    .map(([device, views]) => ({ device, views }));

  // Daily views (last 30 days)
  const dailyMap = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dailyMap[key] = 0;
  }
  last30d.forEach(v => {
    const key = v.timestamp.split('T')[0];
    if (dailyMap[key] !== undefined) dailyMap[key]++;
  });
  const dailyViews = Object.entries(dailyMap).map(([date, views]) => ({ date, views }));

  // Top referrers
  const referrerCount = {};
  last30d.forEach(v => {
    if (v.referrer && v.source !== 'internal' && v.source !== 'direct') {
      try {
        const host = new URL(v.referrer).hostname;
        referrerCount[host] = (referrerCount[host] || 0) + 1;
      } catch { /* skip */ }
    }
  });
  const topReferrers = Object.entries(referrerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([referrer, views]) => ({ referrer, views }));

  return { summary: { today: today.length, last7d: last7d.length, last30d: last30d.length, total: externalViews.length }, topPages, sources, devices, dailyViews, topReferrers };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST — record a page view
  if (req.method === 'POST') {
    const { page, referrer } = req.body || {};
    if (!page || typeof page !== 'string') {
      return res.status(400).json({ error: 'Page path required' });
    }

    const sanitizedPage = page.startsWith('/') ? page.slice(0, 200) : `/${page}`.slice(0, 200);
    const userAgent = req.headers['user-agent'] || '';

    const entry = {
      page: sanitizedPage,
      source: parseReferrerSource(referrer),
      referrer: referrer ? referrer.slice(0, 500) : null,
      device: parseDevice(userAgent),
      timestamp: new Date().toISOString(),
    };

    try {
      const views = await readPageViews();
      views.push(entry);
      await writePageViews(views);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Analytics track error:', error);
      return res.status(500).json({ error: 'Failed to record page view' });
    }
  }

  // GET — return aggregated analytics
  if (req.method === 'GET') {
    try {
      const views = await readPageViews();

      if (req.query.raw === 'true') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recent = views.filter(v => new Date(v.timestamp) >= thirtyDaysAgo);
        return res.status(200).json({ views: recent, total: recent.length });
      }

      const analytics = aggregateData(views);
      return res.status(200).json(analytics);
    } catch (error) {
      console.error('Analytics data error:', error);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
