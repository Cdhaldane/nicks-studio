/**
 * Admin resource handlers — backing logic for the consolidated /api/admin function.
 *
 * Each export is an async (req, res) handler for one resource. api/admin.js
 * dispatches to these based on the ?resource= query param. They live in a
 * single _-prefixed module (Vercel does not turn _-prefixed files into
 * functions) so the whole admin surface costs one Serverless Function instead
 * of seven.
 *
 * Behavior is preserved verbatim from the original admin-*.js endpoints; the
 * only shared change is the readBlobJson/writeBlobJson helper that every
 * resource previously duplicated.
 */
const { head, put } = require('@vercel/blob');

const TOKEN = () => process.env.BLOB_READ_WRITE_TOKEN;

async function readBlobJson(pathname, fallback) {
  try {
    const meta = await head(pathname, { token: TOKEN() });
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
    return await res.json();
  } catch {
    return fallback;
  }
}

async function writeBlobJson(pathname, data) {
  await put(pathname, JSON.stringify(data), {
    access: 'public',
    allowOverwrite: true,
    addRandomSuffix: false,
    token: TOKEN(),
    contentType: 'application/json',
  });
}

const methodNotAllowed = (res) => res.status(405).json({ error: 'Method not allowed' });

/* ── Social Media ── */
const SOCIAL_PATH = 'admin/social-stats.json';
// Mirrors the footer's SOCIAL_MEDIA list (src/utils/constants.js) so the admin
// panel is the source of truth for the links rendered in the site footer.
const DEFAULT_SOCIAL = {
  platforms: [
    { id: 'instagram', name: 'Instagram', icon: 'fa-brands fa-instagram', url: 'https://www.instagram.com/nickolamagnolia', active: true },
    { id: 'youtube', name: 'YouTube', icon: 'fa-brands fa-youtube', url: 'https://www.youtube.com/channel/UC18RGyNPiUxzPAEUFNuvH_Q', active: true },
    { id: 'facebook', name: 'Facebook', icon: 'fa-brands fa-facebook', url: 'https://www.facebook.com/musicmagnolia/', active: true },
    { id: 'tiktok', name: 'TikTok', icon: 'fa-brands fa-tiktok', url: 'https://www.tiktok.com/@nickolamagnolia', active: true },
    { id: 'spotify', name: 'Spotify', icon: 'fa-brands fa-spotify', url: 'https://open.spotify.com/artist/5UrVks2tmoQ4BwTvlkQaI4', active: true },
    { id: 'apple', name: 'Apple Music', icon: 'fa-brands fa-apple', url: 'https://music.apple.com/ca/artist/nickola-magnolia/1588557558', active: true },
  ],
  lastUpdated: null,
};

async function social(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ social: await readBlobJson(SOCIAL_PATH, DEFAULT_SOCIAL) });
  }
  if (req.method === 'PUT') {
    const { social: incoming } = req.body || {};
    if (!incoming) return res.status(400).json({ success: false, message: 'Social data required' });
    const updated = { ...incoming, lastUpdated: new Date().toISOString() };
    await writeBlobJson(SOCIAL_PATH, updated);
    return res.status(200).json({ success: true, social: updated });
  }
  return methodNotAllowed(res);
}

/* ── Press Kit ── */
const PRESS_KIT_PATH = 'admin/press-kit.json';
const DEFAULT_PRESS_KIT = {
  artistName: 'Nickola Magnolia',
  genre: 'Indie / Alternative',
  hometown: '',
  bio: '',
  shortBio: '',
  pressPhotos: [],
  streamingLinks: { spotify: '', appleMusic: '', youtube: '', soundcloud: '' },
  socialLinks: { instagram: '', tiktok: '', twitter: '', facebook: '' },
  contactEmail: '',
  managementEmail: '',
  bookingEmail: '',
  achievements: [],
  updatedAt: null,
};

async function pressKit(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ pressKit: await readBlobJson(PRESS_KIT_PATH, DEFAULT_PRESS_KIT) });
  }
  if (req.method === 'PUT') {
    const { pressKit: incoming } = req.body || {};
    if (!incoming) {
      return res.status(400).json({ success: false, message: 'Press kit data required' });
    }
    const updated = { ...incoming, updatedAt: new Date().toISOString() };
    await writeBlobJson(PRESS_KIT_PATH, updated);
    return res.status(200).json({ success: true, pressKit: updated });
  }
  return methodNotAllowed(res);
}

/* ── Tour Dates ── */
const TOUR_PATH = 'tour/dates.json';

async function tourDates(req, res) {
  if (req.method === 'GET') {
    try {
      return res.status(200).json({ tourDates: await readBlobJson(TOUR_PATH, []) });
    } catch (error) {
      console.error('Error reading tour dates:', error);
      return res.status(500).json({ tourDates: [] });
    }
  }
  if (req.method === 'PUT') {
    const { tourDates: incoming } = req.body || {};
    if (!Array.isArray(incoming)) {
      return res.status(400).json({ success: false, message: 'tourDates must be an array' });
    }
    for (const entry of incoming) {
      if (!entry.date || !entry.venue || !entry.city) {
        return res.status(400).json({
          success: false,
          message: 'Each tour date must have date, venue, and city',
        });
      }
    }
    try {
      await writeBlobJson(TOUR_PATH, incoming);
      return res.status(200).json({ success: true, tourDates: incoming });
    } catch (error) {
      console.error('Error saving tour dates:', error);
      return res.status(500).json({ success: false, message: 'Failed to save tour dates' });
    }
  }
  return methodNotAllowed(res);
}

/* ── Setlists ── */
const SETLISTS_PATH = 'admin/setlists.json';

async function setlists(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ setlists: await readBlobJson(SETLISTS_PATH, []) });
  }
  if (req.method === 'POST') {
    const { setlist } = req.body || {};
    if (!setlist || !setlist.name) {
      return res.status(400).json({ success: false, message: 'Setlist name is required' });
    }
    const current = await readBlobJson(SETLISTS_PATH, []);
    const newSetlist = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: setlist.name,
      songs: setlist.songs || [],
      showDate: setlist.showDate || null,
      venue: setlist.venue || '',
      notes: setlist.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await writeBlobJson(SETLISTS_PATH, [...current, newSetlist]);
    return res.status(201).json({ success: true, setlist: newSetlist });
  }
  if (req.method === 'PUT') {
    const { setlists: incoming } = req.body || {};
    if (!Array.isArray(incoming)) {
      return res.status(400).json({ success: false, message: 'Invalid setlists data' });
    }
    const updated = incoming.map((s) => ({ ...s, updatedAt: new Date().toISOString() }));
    await writeBlobJson(SETLISTS_PATH, updated);
    return res.status(200).json({ success: true, setlists: updated });
  }
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'ID required' });
    const current = await readBlobJson(SETLISTS_PATH, []);
    await writeBlobJson(SETLISTS_PATH, current.filter((s) => s.id !== id));
    return res.status(200).json({ success: true });
  }
  return methodNotAllowed(res);
}

/* ── Booking Requests ── */
const BOOKING_PATH = 'admin/booking-requests.json';

async function bookingRequests(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ requests: await readBlobJson(BOOKING_PATH, []) });
  }
  if (req.method === 'PUT') {
    const { id, status } = req.body || {};
    if (!id || !['pending', 'accepted', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid id or status' });
    }
    const current = await readBlobJson(BOOKING_PATH, []);
    const updated = current.map((r) =>
      r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
    );
    await writeBlobJson(BOOKING_PATH, updated);
    return res.status(200).json({ success: true, requests: updated });
  }
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'ID required' });
    const current = await readBlobJson(BOOKING_PATH, []);
    await writeBlobJson(BOOKING_PATH, current.filter((r) => r.id !== id));
    return res.status(200).json({ success: true });
  }
  return methodNotAllowed(res);
}

/* ── Announcement Popup ── */
const ANNOUNCEMENT_PATH = 'admin/announcement.json';
const ANNOUNCEMENT_IMAGE_PATH = 'admin/announcement-image';
// Seeded so the popup works before the admin ever saves; the Announcement tab
// in the admin dashboard overwrites this blob.
const DEFAULT_ANNOUNCEMENT = {
  enabled: true,
  eyebrow: 'Upcoming Show',
  title: 'Nickola Magnolia Unplugged',
  description:
    'For one night only at the legendary Gores Landing Hall — unplugged and stripped down, for an intimate performance.\n\nFriday, September 18 · 8 PM\nGores Landing Hall, 5199 Burnham St N, Gores Landing, ON',
  linkUrl:
    'https://www.eventbrite.ca/e/nickola-magnolia-unplugged-at-gores-landing-hall-tickets-1994517979969',
  linkText: 'Get Tickets',
  imageUrl: '',
  showSignup: false,
  updatedAt: '2026-07-20T00:00:00.000Z',
};

async function announcement(req, res) {
  if (req.method === 'GET') {
    return res
      .status(200)
      .json({ announcement: await readBlobJson(ANNOUNCEMENT_PATH, DEFAULT_ANNOUNCEMENT) });
  }
  if (req.method === 'PUT') {
    const { announcement: incoming } = req.body || {};
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ success: false, message: 'Announcement data required' });
    }
    if (incoming.enabled && !(incoming.title || '').trim()) {
      return res
        .status(400)
        .json({ success: false, message: 'An enabled announcement needs a title' });
    }
    const updated = {
      enabled: Boolean(incoming.enabled),
      eyebrow: (incoming.eyebrow || '').trim(),
      title: (incoming.title || '').trim(),
      description: (incoming.description || '').trim(),
      linkUrl: (incoming.linkUrl || '').trim(),
      linkText: (incoming.linkText || '').trim(),
      imageUrl: (incoming.imageUrl || '').trim(),
      showSignup: Boolean(incoming.showSignup),
      updatedAt: new Date().toISOString(),
    };
    await writeBlobJson(ANNOUNCEMENT_PATH, updated);
    return res.status(200).json({ success: true, announcement: updated });
  }
  // POST uploads the popup image and returns its URL; the URL is persisted
  // into the announcement via PUT when the admin hits Save.
  if (req.method === 'POST') {
    const { imageData, mimeType } = req.body || {};
    if (!imageData || !mimeType) {
      return res.status(400).json({ success: false, message: 'Missing image data' });
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(mimeType)) {
      return res.status(400).json({ success: false, message: 'Only JPG, PNG and WebP are supported' });
    }
    const buffer = Buffer.from(imageData, 'base64');
    if (buffer.length > MAX_IMAGE_BYTES) {
      return res.status(400).json({ success: false, message: 'Image must be under 5 MB' });
    }
    try {
      const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
      const blob = await put(`${ANNOUNCEMENT_IMAGE_PATH}.${ext}`, buffer, {
        access: 'public',
        allowOverwrite: true,
        addRandomSuffix: false,
        token: TOKEN(),
        contentType: mimeType,
      });
      // Version the URL so replacing the image busts browser/CDN caches.
      return res.status(200).json({ success: true, imageUrl: `${blob.url}?v=${Date.now()}` });
    } catch (error) {
      console.error('Announcement image upload error:', error);
      return res.status(500).json({ success: false, message: 'Failed to upload image' });
    }
  }
  return methodNotAllowed(res);
}

/* ── Popup Hero Image ── */
const IMAGE_PATH = 'popup/hero-image';
const POPUP_CONFIG_PATH = 'popup/config.json';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

async function popupImage(req, res) {
  if (req.method === 'GET') {
    try {
      const config = await readBlobJson(POPUP_CONFIG_PATH, {});
      if (!config.imageUrl) return res.status(200).json({ imageUrl: null });
      const separator = config.imageUrl.includes('?') ? '&' : '?';
      return res.status(200).json({ imageUrl: `${config.imageUrl}${separator}t=${Date.now()}` });
    } catch (error) {
      return res.status(200).json({ imageUrl: null });
    }
  }

  if (req.method === 'POST') {
    const { imageData, mimeType } = req.body || {};
    if (!imageData || !mimeType) {
      return res.status(400).json({ success: false, message: 'Missing image data' });
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(mimeType)) {
      return res.status(400).json({ success: false, message: 'Only JPG, PNG and WebP are supported' });
    }
    const buffer = Buffer.from(imageData, 'base64');
    if (buffer.length > MAX_IMAGE_BYTES) {
      return res.status(400).json({ success: false, message: 'Image must be under 5 MB' });
    }
    try {
      const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
      const blob = await put(`${IMAGE_PATH}.${ext}`, buffer, {
        access: 'public',
        allowOverwrite: true,
        addRandomSuffix: false,
        token: TOKEN(),
        contentType: mimeType,
      });
      await writeBlobJson(POPUP_CONFIG_PATH, {
        imageUrl: blob.url,
        updatedAt: new Date().toISOString(),
      });
      return res.status(200).json({ success: true, imageUrl: `${blob.url}?t=${Date.now()}` });
    } catch (error) {
      console.error('Popup image upload error:', error);
      return res.status(500).json({ success: false, message: 'Failed to upload image' });
    }
  }

  return methodNotAllowed(res);
}

module.exports = {
  social,
  'press-kit': pressKit,
  'tour-dates': tourDates,
  setlists,
  'booking-requests': bookingRequests,
  'popup-image': popupImage,
  announcement,
};
