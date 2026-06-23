/**
 * Square E-Commerce Integration Service
 *
 * This service handles all Square API interactions including:
 * - Fetching catalog items (products)
 * - Creating checkout sessions
 * - Processing payments via Square Web Payments SDK
 */

// Square Configuration
const SQUARE_CONFIG = {
  applicationId: process.env.REACT_APP_SQUARE_APPLICATION_ID || '',
  locationId: process.env.REACT_APP_SQUARE_LOCATION_ID || '',
  environment: process.env.REACT_APP_SQUARE_ENVIRONMENT || 'sandbox', // 'sandbox' or 'production'
  // API base URLs
  apiBaseUrl:
    process.env.REACT_APP_SQUARE_ENVIRONMENT === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com',
};

// For client-side, we need a backend proxy to call Square API
// This assumes you have a backend endpoint that proxies Square API calls
// On Vercel, this will use the serverless functions in the /api folder
const API_PROXY_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * Fetch all products from Square Catalog
 * Note: This requires a backend proxy since Square API requires server-side auth
 */
export const fetchAllProducts = async () => {
  try {
    console.log('Fetching products from Square...');

    const response = await fetch(`${API_PROXY_URL}/square?action=catalog-items`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform Square catalog items to match our app's product format
    const products = transformSquareProducts(data.objects || []);
    console.log(`Successfully fetched ${products.length} products from Square`);

    return products;
  } catch (error) {
    console.error('Error fetching Square products:', error);
    throw error;
  }
};

/**
 * Transform Square catalog items to match the existing product format
 * This maintains compatibility with the existing Cart and Shop components
 */
const PLACEHOLDER_IMAGE = {
  id: 'placeholder',
  src: '/placeholder-product.svg',
  altText: 'Product image coming soon',
};

const transformSquareProducts = catalogItems => {
  const seen = new Set();
  return catalogItems
    .filter(
      item =>
        item.type === 'ITEM' &&
        !item.isDeleted &&
        item.itemData?.productType !== 'APPOINTMENTS_SERVICE'
    )
    .filter(item => {
      const name = item.itemData?.name;
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    })
    .map(item => {
      const itemData = item.itemData;
      const variations = itemData.variations || [];

      // Get images from the itemData.images array (populated by server)
      const images = (itemData.images || [])
        .filter(img => img.url)
        .map((img, index) => ({
          id: img.id,
          src: img.url,
          altText: `${itemData.name} image ${index + 1}`,
        }));

      return {
        id: item.id,
        title: itemData.name,
        description: itemData.description || '',
        descriptionHtml: itemData.description || '',
        handle: itemData.name.toLowerCase().replace(/\s+/g, '-'),
        images: images.length > 0 ? images : [{ ...PLACEHOLDER_IMAGE, altText: itemData.name }],
        variants: variations.map(variation => {
          const varData = variation.itemVariationData;
          const priceMoney = varData?.priceMoney;
          // Square returns price in cents as a string, convert to dollars
          const priceAmount = priceMoney?.amount
            ? parseInt(priceMoney.amount) / 100
            : 0;

          return {
            id: variation.id,
            title: varData?.name || 'Regular',
            available: varData?.sellable !== false,
            price: {
              amount: priceAmount,
              currencyCode: priceMoney?.currency || 'CAD',
            },
            sku: varData?.sku || '',
            pricingType: varData?.pricingType, // FIXED_PRICING or VARIABLE_PRICING
          };
        }),
        // Square-specific fields
        squareItemId: item.id,
        categoryId: itemData.categories?.[0]?.id,
      };
    });
};

/**
 * Fetch a single product by ID
 */
export const fetchProduct = async productId => {
  try {
    const response = await fetch(
      `${API_PROXY_URL}/square?action=catalog-item&id=${productId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    const data = await response.json();
    const products = transformSquareProducts([data.object]);

    return products[0] || null;
  } catch (error) {
    console.error('Error fetching Square product:', error);
    throw error;
  }
};

/**
 * Fetch products by category
 */
export const fetchProductsByCategory = async categoryId => {
  try {
    const response = await fetch(
      `${API_PROXY_URL}/square?action=catalog-category&id=${categoryId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch category products: ${response.statusText}`
      );
    }

    const data = await response.json();
    return transformSquareProducts(data.objects || []);
  } catch (error) {
    console.error('Error fetching Square category products:', error);
    throw error;
  }
};

/**
 * Create a Square Checkout session
 * Returns a checkout URL that redirects to Square's hosted checkout page
 */
export const createCheckout = async lineItems => {
  try {
    console.log('Creating Square checkout with items:', lineItems);

    const response = await fetch(`${API_PROXY_URL}/square?action=checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lineItems: lineItems.map(item => ({
          catalogObjectId: item.variantId,
          quantity: String(item.quantity),
        })),
        redirectUrl: `${window.location.origin}/order-confirmation`,
        locationId: SQUARE_CONFIG.locationId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create checkout');
    }

    const data = await response.json();

    console.log('Square checkout created:', data);

    return {
      webUrl: data.checkout?.checkout_page_url || data.payment_link?.url,
      id: data.checkout?.id || data.payment_link?.id,
      orderId: data.checkout?.order?.id,
    };
  } catch (error) {
    console.error('Error creating Square checkout:', error);
    throw error;
  }
};

/**
 * Create a Square Payment Link (alternative to checkout)
 * Payment links are simpler and don't expire
 */
export const createPaymentLink = async (lineItems, orderInfo = {}) => {
  try {
    console.log('Creating Square payment link with items:', lineItems);

    const response = await fetch(`${API_PROXY_URL}/square?action=payment-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lineItems: lineItems.map(item => ({
          name: item.title,
          quantity: String(item.quantity),
          basePriceMoney: {
            amount: Math.round(item.price * 100), // Convert to cents
            currency: 'USD',
          },
        })),
        checkoutOptions: {
          redirectUrl: `${window.location.origin}/order-confirmation`,
          askForShippingAddress: true,
        },
        ...orderInfo,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create payment link');
    }

    const data = await response.json();

    console.log('Square payment link created:', data);

    return {
      webUrl: data.payment_link.url,
      id: data.payment_link.id,
      orderId: data.payment_link.order_id,
    };
  } catch (error) {
    console.error('Error creating Square payment link:', error);
    throw error;
  }
};

/**
 * Initialize Square Web Payments SDK for inline payments
 * This allows for embedded payment forms
 */
export const initializeSquarePayments = async () => {
  if (!window.Square) {
    console.error('Square Web Payments SDK not loaded');
    return null;
  }

  try {
    const payments = window.Square.payments(
      SQUARE_CONFIG.applicationId,
      SQUARE_CONFIG.locationId
    );

    return payments;
  } catch (error) {
    console.error('Failed to initialize Square payments:', error);
    throw error;
  }
};

/**
 * Create a card payment method for inline checkout
 */
export const createCardPayment = async (payments, containerId) => {
  try {
    const card = await payments.card();
    await card.attach(`#${containerId}`);
    return card;
  } catch (error) {
    console.error('Failed to create card payment:', error);
    throw error;
  }
};

/**
 * Process a payment with the tokenized card
 */
export const processPayment = async (card, amount) => {
  try {
    const result = await card.tokenize();

    if (result.status === 'OK') {
      // Send token to backend to process payment
      const response = await fetch(`${API_PROXY_URL}/square?action=process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId: result.token,
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'USD',
          locationId: SQUARE_CONFIG.locationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment processing failed');
      }

      return await response.json();
    } else {
      throw new Error(
        result.errors?.[0]?.message || 'Card tokenization failed'
      );
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
};

/**
 * Get Square configuration for frontend use
 */
export const getSquareConfig = () => ({
  applicationId: SQUARE_CONFIG.applicationId,
  locationId: SQUARE_CONFIG.locationId,
  environment: SQUARE_CONFIG.environment,
});

export default {
  fetchAllProducts,
  fetchProduct,
  fetchProductsByCategory,
  createCheckout,
  createPaymentLink,
  initializeSquarePayments,
  createCardPayment,
  processPayment,
  getSquareConfig,
};
