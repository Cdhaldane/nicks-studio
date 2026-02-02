import Client from 'shopify-buy';

// Sanitize domain - remove protocol and trailing slash
const sanitizeDomain = domain => {
  if (!domain) return 'nickolamagnolia.myshopify.com';
  return domain
    .replace(/^https?:\/\//, '') // Remove http:// or https://
    .replace(/\/$/, ''); // Remove trailing slash
};

const shopifyDomain = sanitizeDomain(
  process.env.REACT_APP_SHOPIFY_DOMAIN || 'nickolamagnolia.myshopify.com'
);
const storefrontToken =
  process.env.REACT_APP_SHOPIFY_STOREFRONT_TOKEN ||
  '8e7e244e6bb1154a85685231573b7d3f';

console.log('Shopify Config:', {
  domain: shopifyDomain,
  hasToken: !!storefrontToken,
});

// Initialize Shopify client
const client = Client.buildClient({
  domain: shopifyDomain,
  storefrontAccessToken: storefrontToken,
});

/**
 * Fetch all products from Shopify
 */
export const fetchAllProducts = async () => {
  try {
    console.log('Fetching products from Shopify...');
    const products = await client.product.fetchAll();
    console.log(`Successfully fetched ${products.length} products`);
    return products;
  } catch (error) {
    console.error('Error fetching products:', {
      message: error.message,
      domain: shopifyDomain,
      hasToken: !!storefrontToken,
      error: error,
    });
    throw error;
  }
};

/**
 * Fetch a single product by ID
 */
export const fetchProduct = async productId => {
  try {
    const product = await client.product.fetch(productId);
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

/**
 * Fetch products by collection
 */
export const fetchProductsByCollection = async collectionId => {
  try {
    const collection = await client.collection.fetchWithProducts(collectionId);
    return collection.products;
  } catch (error) {
    console.error('Error fetching collection products:', error);
    throw error;
  }
};

/**
 * Create a checkout URL with line items
 * Constructs a direct Shopify cart URL - works with all API versions
 */
export const createCheckout = async lineItems => {
  try {
    console.log('Creating checkout with items:', lineItems);

    // Extract the numeric variant ID from the Shopify GID
    // Format: gid://shopify/ProductVariant/12345678 -> 12345678
    const cartItems = lineItems
      .map(item => {
        const variantId = item.variantId.split('/').pop();
        return `${variantId}:${item.quantity}`;
      })
      .join(',');

    // Construct the checkout URL
    // Format: https://store.myshopify.com/cart/VARIANT_ID:QUANTITY,VARIANT_ID:QUANTITY
    const checkoutUrl = `https://${shopifyDomain}/cart/${cartItems}`;

    console.log('Checkout URL created:', checkoutUrl);

    return {
      webUrl: checkoutUrl,
      id: 'direct-cart',
    };
  } catch (error) {
    console.error('Error creating checkout:', {
      error,
      message: error.message,
      lineItems,
    });
    throw error;
  }
};

/**
 * Add items to existing checkout
 */
export const addToCheckout = async (checkoutId, lineItems) => {
  try {
    const checkout = await client.checkout.addLineItems(checkoutId, lineItems);
    return checkout;
  } catch (error) {
    console.error('Error adding to checkout:', error);
    throw error;
  }
};

/**
 * Remove items from checkout
 */
export const removeFromCheckout = async (checkoutId, lineItemIds) => {
  try {
    const checkout = await client.checkout.removeLineItems(
      checkoutId,
      lineItemIds
    );
    return checkout;
  } catch (error) {
    console.error('Error removing from checkout:', error);
    throw error;
  }
};

/**
 * Update line item quantity
 */
export const updateCheckoutLineItem = async (checkoutId, lineItems) => {
  try {
    const checkout = await client.checkout.updateLineItems(
      checkoutId,
      lineItems
    );
    return checkout;
  } catch (error) {
    console.error('Error updating checkout:', error);
    throw error;
  }
};

/**
 * Get checkout by ID
 */
export const fetchCheckout = async checkoutId => {
  try {
    const checkout = await client.checkout.fetch(checkoutId);
    return checkout;
  } catch (error) {
    console.error('Error fetching checkout:', error);
    throw error;
  }
};

export default {
  client,
  fetchAllProducts,
  fetchProduct,
  fetchProductsByCollection,
  createCheckout,
  addToCheckout,
  removeFromCheckout,
  updateCheckoutLineItem,
  fetchCheckout,
};
