/**
 * Popup Hero Image
 * GET  /api/admin-popup-image  → { imageUrl }
 * POST /api/admin-popup-image  { imageData (base64), mimeType, fileName } → { success, imageUrl }
 */
const { head, put, download } = require('@vercel/blob');

const IMAGE_PATH = 'popup/hero-image';
const CONFIG_PATH = 'popup/config.json';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

async function getConfig() {
  try {
    const meta = await head(CONFIG_PATH, { token: process.env.BLOB_READ_WRITE_TOKEN });
    const res = await download(meta.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return await res.json();
  } catch {
    return {};
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const config = await getConfig();
      if (!config.imagePath || !config.mimeType) {
        return res.status(200).json({ imageUrl: null });
      }
      const imgMeta = await head(config.imagePath, { token: process.env.BLOB_READ_WRITE_TOKEN });
      const imgRes = await download(imgMeta.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      return res.status(200).json({ imageUrl: `data:${config.mimeType};base64,${buffer.toString('base64')}` });
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
    if (buffer.length > MAX_BYTES) {
      return res.status(400).json({ success: false, message: 'Image must be under 5 MB' });
    }

    try {
      const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
      const imagePath = `${IMAGE_PATH}.${ext}`;

      await put(imagePath, buffer, {
        access: 'private',
        allowOverwrite: true,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: mimeType,
      });

      await put(CONFIG_PATH, JSON.stringify({ imagePath, mimeType, updatedAt: new Date().toISOString() }), {
        access: 'private',
        allowOverwrite: true,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: 'application/json',
      });

      return res.status(200).json({ success: true, imageUrl: `data:${mimeType};base64,${buffer.toString('base64')}` });
    } catch (error) {
      console.error('Popup image upload error:', error);
      return res.status(500).json({ success: false, message: 'Failed to upload image' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
