import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import useDialog from '../../hooks/useDialog';
import { createCheckout } from '../../services/squareService';
import { cartCount, cartSubtotal, formatPrice, MAX_LINE_QUANTITY } from '../../utils/cart';
import './Cart.css';

/**
 * Cart button (in the navbar) plus the slide-out cart drawer. The drawer opens
 * from the button or automatically when something is added (cart.isOpen).
 */
const Cart = () => {
  const { items, isOpen } = useSelector(state => state.cart);
  const dispatch = useDispatch();
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const close = () => dispatch({ type: 'CLOSE_CART' });
  const drawerRef = useDialog(isOpen, close);

  const count = cartCount(items);
  const currency = items[0]?.currency;

  const setQuantity = (lineId, quantity) =>
    dispatch({ type: 'SET_CART_QUANTITY', payload: { lineId, quantity } });

  const handleCheckout = async () => {
    setIsProcessing(true);
    setCheckoutError('');
    try {
      // Only catalog IDs and quantities go to the server — Square prices each
      // line from the catalog, so what the browser shows can't change the charge.
      const checkout = await createCheckout(
        items.map(line => ({ variantId: line.variantId, quantity: line.quantity }))
      );
      if (!checkout.webUrl) throw new Error('No checkout URL received');
      window.location.href = checkout.webUrl;
    } catch (error) {
      console.error('Error during checkout:', error);
      setCheckoutError('We couldn’t start checkout. Please try again in a moment.');
      setIsProcessing(false);
    }
  };

  const drawer = (
    <div
      className="cart-backdrop"
      onMouseDown={e => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" ref={drawerRef}>
        <header className="cart-drawer-header">
          <h2 id="cart-title">
            Your cart
            {count > 0 && <span className="cart-drawer-count">{count}</span>}
          </h2>
          <button type="button" className="cart-close" onClick={close} aria-label="Close cart">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="cart-empty">
            <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
            <p>Your cart is empty.</p>
            <Link to="/shop" className="cart-primary" onClick={close}>
              Shop merch
            </Link>
          </div>
        ) : (
          <>
            <ul className="cart-lines">
              {items.map(line => (
                <li className="cart-line" key={line.lineId}>
                  <div className="cart-line-image">
                    {line.image && <img src={line.image} alt="" />}
                  </div>
                  <div className="cart-line-info">
                    <p className="cart-line-title">{line.title}</p>
                    {line.variantTitle && <p className="cart-line-variant">{line.variantTitle}</p>}
                    <p className="cart-line-unit">{formatPrice(line.price, line.currency)}</p>
                    <div className="cart-line-actions">
                      <div className="cart-stepper" role="group" aria-label={`Quantity of ${line.title}`}>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.lineId, line.quantity - 1)}
                          disabled={line.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <i className="fa-solid fa-minus" aria-hidden="true" />
                        </button>
                        <output aria-live="polite">{line.quantity}</output>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.lineId, line.quantity + 1)}
                          disabled={line.quantity >= MAX_LINE_QUANTITY}
                          aria-label="Increase quantity"
                        >
                          <i className="fa-solid fa-plus" aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: line.lineId })}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="cart-line-total">{formatPrice(line.price * line.quantity, line.currency)}</p>
                </li>
              ))}
            </ul>

            <footer className="cart-drawer-footer">
              <div className="cart-subtotal">
                <span>Subtotal</span>
                <span>{formatPrice(cartSubtotal(items), currency)}</span>
              </div>
              <p className="cart-note">Taxes and shipping are calculated at checkout.</p>
              {checkoutError && (
                <p className="cart-error" role="alert">
                  {checkoutError}
                </p>
              )}
              <button type="button" className="cart-primary" onClick={handleCheckout} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <span className="cart-spinner" aria-hidden="true" />
                    Starting checkout…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-lock" aria-hidden="true" />
                    Check out
                  </>
                )}
              </button>
              <button type="button" className="cart-continue" onClick={close}>
                Continue shopping
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="cart-icon-btn"
        onClick={() => dispatch({ type: 'OPEN_CART' })}
        aria-label={count > 0 ? `Open cart, ${count} item${count === 1 ? '' : 's'}` : 'Open cart'}
      >
        <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
        {count > 0 && <span className="cart-count">{count}</span>}
      </button>
      {/* Portalled out of the fixed navbar so its stacking context can't trap the drawer. */}
      {isOpen && createPortal(drawer, document.body)}
    </>
  );
};

export default Cart;
