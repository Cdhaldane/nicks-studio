/**
 * Cart line helpers shared by the shop, the product dialog and the cart drawer.
 *
 * A line is one variant of one product — the same shirt in M and L is two
 * lines. Lines carry only what the drawer displays; Square re-prices every
 * line from the catalog at checkout, so a stale price here can't change the charge.
 */

export const MAX_LINE_QUANTITY = 10;

/** `$35.00` for CAD — the shop's catalog currency — and `US$35.00` for anything else. */
export const formatPrice = (amount, currency = 'CAD') => {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
};

export const lineIdFor = (productId, variantId) => `${productId}:${variantId}`;

/** Builds the cart line for a product + chosen variant. */
export const toCartLine = (product, variant, quantity) => ({
  lineId: lineIdFor(product.id, variant.id),
  productId: product.id,
  variantId: variant.id,
  title: product.title,
  // Single-variant Square items are all named "Regular" — not worth showing.
  variantTitle: product.variants.length > 1 ? variant.title : '',
  image: product.images?.[0]?.src || '',
  price: Number(variant.price?.amount) || 0,
  currency: variant.price?.currencyCode || 'CAD',
  quantity,
});

/** True when a stored value still looks like a cart line (localStorage can hold anything). */
export const isCartLine = line =>
  Boolean(line) &&
  typeof line.lineId === 'string' &&
  typeof line.variantId === 'string' &&
  typeof line.title === 'string' &&
  Number.isInteger(line.quantity) &&
  line.quantity >= 1;

export const cartCount = lines => lines.reduce((sum, line) => sum + line.quantity, 0);

export const cartSubtotal = lines => lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
