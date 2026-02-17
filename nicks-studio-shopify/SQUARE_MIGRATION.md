# Migrating from Shopify to Square

This guide covers the steps to migrate your e-commerce integration from Shopify to Square.

## Prerequisites

1. **Square Account**: Create a Square account at [squareup.com](https://squareup.com)
2. **Square Developer Account**: Register at [developer.squareup.com](https://developer.squareup.com)
3. **Create a Square Application**: Get your Application ID and Access Token

## Step 1: Install Dependencies

```bash
# Frontend dependencies (minimal - most work is server-side)
npm install

# Backend dependencies
npm install express cors dotenv square
```

## Step 2: Set Up Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.square.example .env
```

Required variables:
- `REACT_APP_SQUARE_APPLICATION_ID` - From Square Developer Dashboard
- `REACT_APP_SQUARE_LOCATION_ID` - Your Square Location ID
- `SQUARE_ACCESS_TOKEN` - Server-side access token (keep secret!)

## Step 3: Set Up Your Square Catalog

### Option A: Use Square Dashboard (Recommended for small catalogs)
1. Go to [Square Dashboard](https://squareup.com/dashboard)
2. Navigate to Items > Item Library
3. Add your products with images, prices, and variants

### Option B: Migrate Programmatically
Use the Square Catalog API to import products from Shopify:

```javascript
// Example migration script
const { Client } = require('square');

async function migrateProducts(shopifyProducts) {
  const client = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: 'sandbox', // Change to 'production' when ready
  });

  for (const product of shopifyProducts) {
    await client.catalogApi.upsertCatalogObject({
      idempotencyKey: `migrate-${product.id}`,
      object: {
        type: 'ITEM',
        id: `#${product.handle}`,
        itemData: {
          name: product.title,
          description: product.description,
          variations: product.variants.map(v => ({
            type: 'ITEM_VARIATION',
            id: `#${v.id}`,
            itemVariationData: {
              name: v.title,
              priceMoney: {
                amount: Math.round(parseFloat(v.price) * 100),
                currency: 'USD',
              },
            },
          })),
        },
      },
    });
  }
}
```

## Step 4: Start the Backend Server

The Square API requires server-side authentication. Run the proxy server:

```bash
node server/squareApi.js
```

Or add it to your existing backend.

## Step 5: Update Your App to Use Square

### Option A: Complete Replacement
Replace the Cart import in your app:

```jsx
// Before (Shopify)
import Cart from './components/Cart/Cart';

// After (Square)
import Cart from './components/Cart/CartSquare';
```

### Option B: Feature Flag (Recommended)
Use an environment variable to switch between providers:

```jsx
const Cart = process.env.REACT_APP_USE_SQUARE 
  ? require('./components/Cart/CartSquare').default
  : require('./components/Cart/Cart').default;
```

## Step 6: Update Product Fetching

In your Shop component or wherever you fetch products:

```jsx
// Before
import { fetchAllProducts } from '../services/shopifyService';

// After
import { fetchAllProducts } from '../services/squareService';
```

## File Changes Summary

| File | Change |
|------|--------|
| `src/services/squareService.js` | NEW - Square API client |
| `src/components/Cart/CartSquare.jsx` | NEW - Square-compatible Cart |
| `src/components/Cart/Cart.css` | UPDATED - Modern styling |
| `server/squareApi.js` | NEW - Backend proxy server |
| `.env.square.example` | NEW - Environment template |

## Testing

1. **Sandbox Testing**: Always test in sandbox mode first
2. **Test Cards**: Use Square's [test card numbers](https://developer.squareup.com/docs/testing/test-values)
   - Success: `4532 0000 0000 0000`
   - Decline: `4000 0000 0000 0002`

## Going Live

1. Change `REACT_APP_SQUARE_ENVIRONMENT` to `production`
2. Use your production Access Token
3. Ensure your Location ID is for a production location
4. Complete Square's application review if required

## Key Differences from Shopify

| Feature | Shopify | Square |
|---------|---------|--------|
| Checkout | Fully customizable | Hosted checkout page |
| API Auth | Storefront token (public) | Access token (server-only) |
| Cart | Client-side | Client-side with server checkout |
| Subscriptions | Built-in | Requires Square Subscriptions API |
| Shipping | Built-in calculator | Manual or third-party |

## Rollback Plan

If you need to revert to Shopify:
1. Switch your Cart import back to the original
2. Revert product fetching to `shopifyService`
3. Remove Square environment variables

The original Shopify files are preserved and can be restored instantly.

## Support

- [Square Developer Docs](https://developer.squareup.com/docs)
- [Square API Reference](https://developer.squareup.com/reference/square)
- [Square Developer Forums](https://developer.squareup.com/forums)
