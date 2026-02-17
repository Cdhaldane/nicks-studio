import React, { useState, useEffect } from 'react';
import './Modal.css'; // Import your CSS here

function Modal({ isOpen, onClose, product, onExecute }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (product?.variants?.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
    setCurrentImageIndex(0);
  }, [product]);

  useEffect(() => {
    const handleClickOutside = e => {
      if (e.target.className === 'modal') {
        onClose();
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      selectedVariant,
      quantity,
    };
    onExecute(cartItem);
    setQuantity(1);
  };

  const currentPrice = selectedVariant
    ? parseFloat(selectedVariant.price.amount).toFixed(2)
    : '0.00';

  const isAvailable = selectedVariant?.available !== false;

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{product.title}</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-main">
          <div className="modal-left">
            <div className="image-gallery">
              {product.images.length > 1 && (
                <button
                  className="gallery-nav gallery-nav-prev"
                  onClick={() => setCurrentImageIndex(prev => 
                    prev === 0 ? product.images.length - 1 : prev - 1
                  )}
                  aria-label="Previous image"
                >
                  &#8249;
                </button>
              )}
              <img
                src={product.images[currentImageIndex]?.src}
                alt={`${product.title} - Image ${currentImageIndex + 1}`}
                className="item-image"
              />
              {product.images.length > 1 && (
                <button
                  className="gallery-nav gallery-nav-next"
                  onClick={() => setCurrentImageIndex(prev => 
                    prev === product.images.length - 1 ? 0 : prev + 1
                  )}
                  aria-label="Next image"
                >
                  &#8250;
                </button>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="image-thumbnails">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={image.src} alt={`${product.title} thumbnail ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="modal-right">
            {product.description && (
              <div
                className="product-description"
                dangerouslySetInnerHTML={{
                  __html: product.descriptionHtml || product.description,
                }}
              />
            )}

          {/* Variant Selection */}
          {product.variants.length > 1 && (
            <div className="variant-selector">
              <label htmlFor="variant-select">Select Option:</label>
              <select
                id="variant-select"
                value={selectedVariant?.id}
                onChange={e => {
                  const variant = product.variants.find(
                    v => v.id === e.target.value
                  );
                  setSelectedVariant(variant);
                }}
                className="variant-dropdown"
              >
                {product.variants.map(variant => (
                  <option
                    key={variant.id}
                    value={variant.id}
                    disabled={!variant.available}
                  >
                    {variant.title} - $
                    {parseFloat(variant.price.amount).toFixed(2)}
                    {!variant.available && ' (Sold Out)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity Selection */}
          <div className="quantity-selector">
            <label htmlFor="quantity">Quantity:</label>
            <div className="quantity-controls">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="quantity-btn"
              >
                -
              </button>
              <input
                id="quantity"
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={e =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="quantity-input"
              />
              <button
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                disabled={quantity >= 10}
                className="quantity-btn"
              >
                +
              </button>
            </div>
          </div>

          <div className="modal-price">
            <h2>${currentPrice}</h2>
            {quantity > 1 && (
              <p className="total-price">
                Total: ${(currentPrice * quantity).toFixed(2)}
              </p>
            )}
          </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn modal-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="modal-btn modal-btn-primary"
            onClick={handleAddToCart}
            disabled={!isAvailable}
          >
            {isAvailable ? 'Add To Cart' : 'Sold Out'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
