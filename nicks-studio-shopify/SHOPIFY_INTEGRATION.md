# Shopify Integration Guide

## Overview

Your website now has full Shopify integration, allowing you to sell products directly through your existing site while keeping customers on your domain. Shopify handles inventory, checkout, payments, and order fulfillment in the background.

## What's Been Improved

### 1. **Shopify Service Layer** (`src/services/shopifyService.js`)

- Centralized API calls to Shopify
- Clean separation of concerns
- Easy to maintain and extend
- Supports products, collections, and checkout operations

### 2. **Enhanced Shop Component**

- Better product display with images
- Shows variant count when multiple options available
- Sold-out badges for unavailable items
- Error handling with retry option
- Loading states
- Lazy loading images for better performance

### 3. **Advanced Product Modal**

- **Variant Selection**: Dropdown for size/color/type options
- **Quantity Controls**: Add multiple items at once
- **Price Display**: Shows unit price and total
- **Product Description**: Full HTML descriptions rendered
- **Availability Check**: Disables "Add to Cart" for sold-out items

### 4. **Improved Shopping Cart**

- **Quantity Management**: Adjust quantities directly in cart
- **Remove Items**: Easy item removal
- **Smart Totaling**: Calculates price × quantity
- **Checkout Integration**: Direct to Shopify checkout
- **Cart Count Badge**: Shows total items in cart icon
- **Better Layout**: Cleaner, more professional design

### 5. **Redux Store Updates**

- Added `UPDATE_CART` action for quantity changes
- Added `CLEAR_CART` action for post-checkout cleanup
- Better item removal handling

## How It Works

### User Flow

1. User browses products on `/shop` (your domain)
2. Clicks a product to see details
3. Selects variant (size/color) and quantity
4. Adds to cart (stored in Redux/localStorage)
5. Reviews cart with full price breakdown
6. Clicks "Checkout"
7. Redirects to Shopify's secure checkout page
8. Shopify handles payment and order fulfillment
9. Order confirmation sent to customer

### Behind the Scenes

- Products are fetched from Shopify via Storefront API
- Cart is managed locally in Redux state
- When user checks out, we create a Shopify checkout session
- User is redirected to Shopify's hosted checkout
- After purchase, Shopify handles everything else

## Configuration

### Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
REACT_APP_SHOPIFY_DOMAIN=nickolamagnolia.myshopify.com
REACT_APP_SHOPIFY_STOREFRONT_TOKEN=your_token_here
```

### Getting Your Shopify Credentials

1. **Login to Shopify Admin**: `https://nickolamagnolia.myshopify.com/admin`

2. **Create a Custom App**:
   - Go to **Settings** → **Apps and sales channels**
   - Click **Develop apps**
   - Click **Create an app**
   - Name it "Website Integration"

3. **Configure Storefront API**:
   - Click **Configure Storefront API scopes**
   - Enable these scopes:
     - `unauthenticated_read_product_listings`
     - `unauthenticated_read_checkouts`
     - `unauthenticated_write_checkouts`
   - Click **Save**

4. **Get Your Token**:
   - Click **Install app**
   - Copy the **Storefront API access token**
   - Add it to your `.env` file

## Features

### Product Display

- Responsive grid layout
- Product images with lazy loading
- Price display
- Variant indicators
- Sold-out badges

### Variant Handling

- Automatic detection of product options
- Dropdown selector for variants
- Price updates based on selection
- Stock availability per variant

### Cart Features

- Add/remove items
- Quantity adjustment
- Price calculation
- Persistent cart (localStorage)
- Visual cart count

### Checkout

- Secure Shopify checkout
- All payment methods supported
- SSL encrypted
- PCI compliant
- Automatic order emails

## SEO Benefits

- All products live on your domain
- Google indexes your shop pages
- Better brand consistency
- Lower bounce rate
- Single domain authority

## Next Steps

### Recommended Enhancements

1. **Add Collections**: Group products by category
2. **Product Search**: Filter/search functionality
3. **Wishlist**: Save favorite items
4. **Related Products**: Suggest similar items
5. **Product Reviews**: Integrate review system
6. **Order Tracking**: Show order status (requires Admin API)

### Marketing Integration

1. **Google Analytics**: Track product views and purchases
2. **Facebook Pixel**: Retargeting campaigns
3. **Email Marketing**: Abandoned cart emails
4. **Discount Codes**: Shopify discount URL parameters

## Testing

### Test the Integration

1. Start your dev server: `npm start`
2. Navigate to `/shop`
3. Try adding products to cart
4. Test variant selection
5. Proceed to checkout (use Shopify test mode)

### Test Mode

In Shopify Admin:

- **Settings** → **Payments**
- Enable **Shopify Payments test mode**
- Use test credit cards for checkout testing

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy

Your current deployment process remains the same. The Shopify API calls work from any domain (ensure CORS is configured in Shopify).

## Support

### Common Issues

**Products not loading?**

- Check your API token in `.env`
- Verify Storefront API scopes
- Check browser console for errors

**Checkout not working?**

- Ensure checkout scopes are enabled
- Check network tab for failed requests
- Verify products are published to "Online Store" channel

**Variant selection issues?**

- Ensure products have variants configured in Shopify
- Check variant availability

### Shopify Resources

- [Storefront API Docs](https://shopify.dev/api/storefront)
- [shopify-buy SDK](https://shopify.github.io/js-buy-sdk/)
- [Shopify Help Center](https://help.shopify.com)

## File Structure

```
src/
├── services/
│   └── shopifyService.js          # Centralized Shopify API calls
├── components/
│   ├── Shop/
│   │   ├── Shop.jsx               # Enhanced product listing
│   │   └── Shop.css               # Shop styling
│   ├── Modal/
│   │   ├── Modal.jsx              # Product details with variants
│   │   └── Modal.css              # Modal styling
│   └── Cart/
│       ├── Cart.jsx               # Shopping cart with checkout
│       └── Cart.css               # Cart styling
└── reducers/
    └── cartReducer.js             # Redux cart state management
```

## Summary

You now have a professional e-commerce integration that:

- ✅ Keeps users on your domain
- ✅ Handles variants and quantities
- ✅ Provides secure checkout via Shopify
- ✅ Scales with your business
- ✅ Requires minimal maintenance
- ✅ Looks professional and polished

Your shop is ready to sell! 🎉
