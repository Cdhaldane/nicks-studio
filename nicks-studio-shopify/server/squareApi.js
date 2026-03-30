/**
 * Square API Backend Proxy
 * 
 * This Express server handles Square API calls that require server-side authentication.
 * Run this separately or integrate into your existing backend.
 * 
 * Setup:
 * 1. npm install express cors dotenv square
 * 2. Create .env with Square credentials
 * 3. node server/squareApi.js
 */

const express = require('express');
const cors = require('cors');
const { SquareClient, SquareEnvironment } = require('square');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Fix BigInt serialization for JSON responses
// Square SDK uses BigInt for monetary values
const bigIntReplacer = (key, value) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

// Custom JSON response that handles BigInt
const sendJSON = (res, data, status = 200) => {
  res.status(status).set('Content-Type', 'application/json').send(JSON.stringify(data, bigIntReplacer));
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Square Client
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' 
    ? SquareEnvironment.Production 
    : SquareEnvironment.Sandbox,
});

// New SDK accesses APIs directly from client
const locationId = process.env.SQUARE_LOCATION_ID;

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Square API Proxy' });
});

/**
 * Get all catalog items (products)
 */
app.get('/api/square-catalog-items', async (req, res) => {
  try {
    const response = await squareClient.catalog.list({ types: 'ITEM' });
    
    // Collect all items from paginated response
    const items = [];
    for await (const item of response) {
      items.push(item);
    }
    
    // Fetch images for items
    const imageIds = items
      .flatMap(item => item.itemData?.imageIds || [])
      .filter(Boolean);
    
    let images = {};
    if (imageIds.length > 0) {
      const imageResponse = await squareClient.catalog.batchGet({
        objectIds: imageIds,
      });
      images = (imageResponse.objects || []).reduce((acc, img) => {
        acc[img.id] = img.imageData?.url;
        return acc;
      }, {});
    }

    // Attach image URLs to items
    const itemsWithImages = items.map(item => ({
      ...item,
      itemData: {
        ...item.itemData,
        images: (item.itemData?.imageIds || []).map(id => ({
          id,
          url: images[id],
        })),
      },
    }));

    sendJSON(res, { objects: itemsWithImages });
  } catch (error) {
    console.error('Error fetching catalog:', error);
    sendJSON(res, { 
      error: 'Failed to fetch catalog',
      message: error.message 
    }, 500);
  }
});

/**
 * Get a single catalog item
 */
app.get('/api/square/catalog/item/:id', async (req, res) => {
  try {
    const response = await squareClient.catalog.get({ objectId: req.params.id, includeRelatedObjects: true });
    sendJSON(res, response);
  } catch (error) {
    console.error('Error fetching item:', error);
    sendJSON(res, { 
      error: 'Failed to fetch item',
      message: error.message 
    }, 500);
  }
});

/**
 * Get catalog image URL
 */
app.get('/api/square/catalog/image/:id', async (req, res) => {
  try {
    const response = await squareClient.catalog.get({ objectId: req.params.id });
    const imageUrl = response.object?.imageData?.url;
    
    if (imageUrl) {
      res.redirect(imageUrl);
    } else {
      sendJSON(res, { error: 'Image not found' }, 404);
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    sendJSON(res, { 
      error: 'Failed to fetch image',
      message: error.message 
    }, 500);
  }
});

/**
 * Get items by category
 */
app.get('/api/square/catalog/category/:id', async (req, res) => {
  try {
    const response = await squareClient.catalog.searchItems({
      categoryIds: [req.params.id],
    });
    sendJSON(res, { objects: response.items || [] });
  } catch (error) {
    console.error('Error fetching category:', error);
    sendJSON(res, { 
      error: 'Failed to fetch category',
      message: error.message 
    }, 500);
  }
});

/**
 * Create a checkout session (Square Checkout API)
 */
app.post('/api/square/checkout', async (req, res) => {
  try {
    const { lineItems, redirectUrl } = req.body;
    
    // Create an order first
    const orderResponse = await squareClient.orders.create({
      order: {
        locationId,
        lineItems: lineItems.map(item => ({
          catalogObjectId: item.catalogObjectId,
          quantity: String(item.quantity),
        })),
      },
      idempotencyKey: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    // Create payment link using the new SDK method
    const checkoutResponse = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: `checkout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: {
        locationId,
        lineItems: lineItems.map(item => ({
          catalogObjectId: item.catalogObjectId,
          quantity: String(item.quantity),
        })),
      },
      checkoutOptions: {
        redirectUrl: redirectUrl || `${process.env.FRONTEND_URL}/order-confirmation`,
        askForShippingAddress: true,
      },
    });

    sendJSON(res, {
      checkout: {
        id: checkoutResponse.paymentLink?.id,
        checkout_page_url: checkoutResponse.paymentLink?.url,
        order: orderResponse.order,
      },
      payment_link: checkoutResponse.paymentLink,
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    sendJSON(res, { 
      error: 'Failed to create checkout',
      message: error.message,
      details: error.errors 
    }, 500);
  }
});

/**
 * Create a payment link (simpler alternative to checkout)
 */
app.post('/api/square/payment-link', async (req, res) => {
  try {
    const { lineItems, checkoutOptions } = req.body;

    const response = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      quickPay: lineItems.length === 1 ? {
        name: lineItems[0].name,
        priceMoney: lineItems[0].basePriceMoney,
        locationId,
      } : undefined,
      order: lineItems.length > 1 ? {
        locationId,
        lineItems: lineItems.map(item => ({
          name: item.name,
          quantity: String(item.quantity),
          basePriceMoney: item.basePriceMoney,
        })),
      } : undefined,
      checkoutOptions: {
        redirectUrl: checkoutOptions?.redirectUrl || `${process.env.FRONTEND_URL}/order-confirmation`,
        askForShippingAddress: checkoutOptions?.askForShippingAddress ?? true,
      },
    });

    sendJSON(res, response);
  } catch (error) {
    console.error('Error creating payment link:', error);
    sendJSON(res, { 
      error: 'Failed to create payment link',
      message: error.message,
      details: error.errors 
    }, 500);
  }
});

/**
 * Process a payment (for inline payments with Web Payments SDK)
 */
app.post('/api/square/process-payment', async (req, res) => {
  try {
    const { sourceId, amount, currency, verificationToken } = req.body;

    const response = await squareClient.payments.create({
      sourceId,
      idempotencyKey: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amountMoney: {
        amount: BigInt(amount),
        currency: currency || 'USD',
      },
      locationId,
      verificationToken,
    });

    sendJSON(res, response);
  } catch (error) {
    console.error('Error processing payment:', error);
    sendJSON(res, { 
      error: 'Failed to process payment',
      message: error.message,
      details: error.errors 
    }, 500);
  }
});

/**
 * Get order details
 */
app.get('/api/square/order/:id', async (req, res) => {
  try {
    const response = await squareClient.orders.get({ orderId: req.params.id });
    sendJSON(res, response);
  } catch (error) {
    console.error('Error fetching order:', error);
    sendJSON(res, { 
      error: 'Failed to fetch order',
      message: error.message 
    }, 500);
  }
});

// ── Newsletter routes (local dev — stores in data/newsletter-subscribers.json) ──
const fs = require('fs');
const SUBSCRIBERS_FILE = path.join(__dirname, '..', 'src', 'data', 'newsletter-subscribers.json');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readSubscribers = () => {
  try {
    return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8'));
  } catch {
    return [];
  }
};

const writeSubscribers = (subscribers) => {
  fs.mkdirSync(path.dirname(SUBSCRIBERS_FILE), { recursive: true });
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
};

app.post('/api/newsletter-subscribe', (req, res) => {
  const { email, source = 'website' } = req.body || {};
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }
  const normalizedEmail = email.toLowerCase().trim();
  const subscribers = readSubscribers();
  if (subscribers.some(s => s.email === normalizedEmail)) {
    return res.status(409).json({ success: false, message: 'Email already subscribed' });
  }
  const subscriber = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    email: normalizedEmail,
    source,
    status: 'active',
    subscribed_at: new Date().toISOString(),
  };
  writeSubscribers([subscriber, ...subscribers]);
  res.json({ success: true, message: 'Successfully subscribed!', subscriber });
});

app.get('/api/newsletter-subscribers', (req, res) => {
  const subscribers = readSubscribers();
  res.json({ subscribers, total: subscribers.length });
});

app.delete('/api/newsletter-subscribers', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });
  const normalizedEmail = email.toLowerCase().trim();
  const updated = readSubscribers().filter(s => s.email !== normalizedEmail);
  writeSubscribers(updated);
  res.json({ success: true, message: 'Subscriber removed' });
});

// ── Popup image routes (local dev — stores in public/) ──
const POPUP_CONFIG_FILE = path.join(__dirname, '..', 'src', 'data', 'popup-config.json');

const readPopupConfig = () => {
  try { return JSON.parse(fs.readFileSync(POPUP_CONFIG_FILE, 'utf8')); }
  catch { return {}; }
};

app.get('/api/admin-popup-image', (req, res) => {
  const config = readPopupConfig();
  res.json({ imageUrl: config.imageUrl || null });
});

app.post('/api/admin-popup-image', (req, res) => {
  const { imageData, mimeType } = req.body || {};
  if (!imageData || !mimeType) {
    return res.status(400).json({ success: false, message: 'Missing image data' });
  }
  const buffer = Buffer.from(imageData, 'base64');
  const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
  const filename = `popup-hero.${ext}`;
  fs.writeFileSync(path.join(__dirname, '..', 'public', filename), buffer);
  const imageUrl = `/${filename}`;
  fs.mkdirSync(path.dirname(POPUP_CONFIG_FILE), { recursive: true });
  fs.writeFileSync(POPUP_CONFIG_FILE, JSON.stringify({ imageUrl, updatedAt: new Date().toISOString() }, null, 2));
  res.json({ success: true, imageUrl });
});

// Start server
app.listen(PORT, () => {
  console.log(`Square API proxy running on port ${PORT}`);
  console.log(`Environment: ${process.env.SQUARE_ENVIRONMENT || 'sandbox'}`);
});

module.exports = app;
