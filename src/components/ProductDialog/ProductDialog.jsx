import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import useDialog from '../../hooks/useDialog';
import { formatPrice, MAX_LINE_QUANTITY } from '../../utils/cart';
import './ProductDialog.css';

/** Square "variable pricing" items have no fixed price, so they can't go through checkout. */
const isPurchasable = variant =>
  variant.available !== false && variant.pricingType !== 'VARIABLE_PRICING' && Number(variant.price?.amount) > 0;

/**
 * Product detail dialog: gallery, option pills, quantity and add-to-cart.
 * Rendered into <body> so no page stacking context can sit above it.
 *
 * @param {object|null} product  The product to show; null keeps it closed.
 */
function ProductDialog({ product, onClose, onAddToCart }) {
  const dialogRef = useDialog(Boolean(product), onClose);
  if (!product) return null;

  return createPortal(
    <div
      className="pd-backdrop"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pd" role="dialog" aria-modal="true" aria-labelledby="pd-title" ref={dialogRef}>
        <button type="button" className="pd-close" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
        {/* Keyed so every product opens fresh: first in-stock option, one item, first photo. */}
        <ProductDetails key={product.id} product={product} onAddToCart={onAddToCart} />
      </div>
    </div>,
    document.body
  );
}

function ProductDetails({ product, onAddToCart }) {
  const [variant, setVariant] = useState(
    () => product.variants.find(isPurchasable) || product.variants[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  const images = product.images || [];
  const currency = variant.price?.currencyCode;
  const unitPrice = Number(variant.price?.amount) || 0;
  const canBuy = isPurchasable(variant);
  const hasOptions = product.variants.length > 1;
  const showImage = step => setImageIndex(i => (i + step + images.length) % images.length);

  return (
    <>
      <div className="pd-gallery">
        <div className="pd-main-image">
          <img
            src={images[imageIndex]?.src}
            alt={images.length > 1 ? `${product.title}, photo ${imageIndex + 1} of ${images.length}` : product.title}
          />
          {images.length > 1 && (
            <>
              <button type="button" className="pd-nav is-prev" onClick={() => showImage(-1)} aria-label="Previous photo">
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <button type="button" className="pd-nav is-next" onClick={() => showImage(1)} aria-label="Next photo">
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
        {images.length > 1 && (
          <div className="pd-thumbs">
            {images.map((image, index) => (
              <button
                type="button"
                key={image.id || index}
                className={`pd-thumb${index === imageIndex ? ' is-active' : ''}`}
                onClick={() => setImageIndex(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-current={index === imageIndex}
              >
                <img src={image.src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pd-info">
        <h2 id="pd-title" className="pd-title">
          {product.title}
        </h2>
        <p className="pd-price">{formatPrice(unitPrice, currency)}</p>

        {hasOptions && (
          <fieldset className="pd-options">
            <legend>Options</legend>
            <div className="pd-pills">
              {product.variants.map(option => {
                const available = isPurchasable(option);
                return (
                  <label
                    key={option.id}
                    className={`pd-pill${option.id === variant.id ? ' is-selected' : ''}${available ? '' : ' is-unavailable'}`}
                  >
                    <input
                      type="radio"
                      name="pd-variant"
                      value={option.id}
                      checked={option.id === variant.id}
                      disabled={!available}
                      onChange={() => setVariant(option)}
                    />
                    {option.title}
                    {!available && <span className="sr-only"> (sold out)</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className="pd-buy">
          <div className="pd-stepper" role="group" aria-label="Quantity">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <i className="fa-solid fa-minus" aria-hidden="true" />
            </button>
            <output aria-live="polite">{quantity}</output>
            <button
              type="button"
              onClick={() => setQuantity(q => Math.min(MAX_LINE_QUANTITY, q + 1))}
              disabled={quantity >= MAX_LINE_QUANTITY}
              aria-label="Increase quantity"
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className="pd-add"
            onClick={() => onAddToCart(product, variant, quantity)}
            disabled={!canBuy}
          >
            {canBuy ? (
              <>
                Add to cart
                <span className="pd-add-price">{formatPrice(unitPrice * quantity, currency)}</span>
              </>
            ) : (
              'Sold out'
            )}
          </button>
        </div>

        <ul className="pd-assurances">
          <li>
            <i className="fa-solid fa-lock" aria-hidden="true" />
            Secure checkout with Square
          </li>
          <li>
            <i className="fa-solid fa-truck" aria-hidden="true" />
            Shipping and taxes calculated at checkout
          </li>
        </ul>

        {product.description && (
          <div className="pd-description">
            <h3>Details</h3>
            {/* Square descriptions are plain text; pre-line keeps their line breaks. */}
            <p>{product.description}</p>
          </div>
        )}
      </div>
    </>
  );
}

export default ProductDialog;
