import React, { useState, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { createCheckout, createPaymentLink } from '../../services/squareService';
import './Cart.css';

const Cart = ({ items }) => {
  const [showModal, setShowModal] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setCartItems(items.map(item => JSON.parse(item)));
  }, [items]);

  useEffect(() => {
    if (cartItems.length !== 0) {
      let outTotal = 0;
      cartItems.forEach(item => {
        const price = parseFloat(
          item.selectedVariant?.price?.amount ||
            item.variants[0]?.price?.amount ||
            0
        );
        const qty = item.quantity || 1;
        outTotal += price * qty;
      });
      setTotal(outTotal.toFixed(2));
    } else {
      setTotal(0);
    }
  }, [cartItems]);

  useEffect(() => {
    const handleClickOutside = e => {
      if (e.target.className === 'modal') {
        setShowModal(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      // Prepare line items for Square checkout
      const lineItems = cartItems.map(item => {
        const variant = item.selectedVariant || item.variants[0];
        return {
          variantId: variant?.id,
          quantity: item.quantity || 1,
          title: item.title,
          price: parseFloat(variant?.price?.amount || 0),
        };
      });

      // Try creating a payment link (simpler, works without full catalog setup)
      // Falls back to checkout if payment link fails
      let checkout;
      try {
        checkout = await createPaymentLink(lineItems);
      } catch (linkError) {
        console.log('Payment link failed, trying checkout:', linkError);
        checkout = await createCheckout(lineItems);
      }

      if (checkout.webUrl) {
        window.location.href = checkout.webUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('There was an error processing your checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeItem = itemId => {
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: itemId,
    });
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    const updatedItems = cartItems.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    dispatch({
      type: 'UPDATE_CART',
      payload: updatedItems.map(item => JSON.stringify(item)),
    });
  };

  return (
    <>
      {showModal && (
        <div className="modal">
          <div className="modal-content cart-modal">
            <div className="modal-header">
              <h2 className="modal-title">Shopping Cart</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close cart"
              >
                &times;
              </button>
            </div>
            
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-cart-icon">
                  <i className="fas fa-shopping-bag"></i>
                </div>
                <h3>Your cart is empty</h3>
                <p>Looks like you haven't added anything yet.</p>
                <button 
                  className="cart-btn cart-btn-primary"
                  onClick={() => setShowModal(false)}
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items-container">
                  {cartItems.map((item, index) => {
                    const variant = item.selectedVariant || item.variants[0];
                    const qty = item.quantity || 1;
                    const price = parseFloat(variant?.price?.amount || 0);

                    return (
                      <div className="cart-item" key={item.id || index}>
                        <div className="cart-item-image">
                          <img src={item.images[0]?.src} alt={item.title} />
                        </div>
                        <div className="cart-item-details">
                          <h3 className="cart-item-title">{item.title}</h3>
                          {variant?.title && variant.title !== 'Default Title' && (
                            <p className="cart-item-variant">{variant.title}</p>
                          )}
                          <div className="cart-quantity-controls">
                            <button
                              onClick={() => updateQuantity(item.id, qty - 1)}
                              className="qty-btn"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="qty-display">{qty}</span>
                            <button
                              onClick={() => updateQuantity(item.id, qty + 1)}
                              className="qty-btn"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="cart-item-price">
                          <span className="price-total">${(price * qty).toFixed(2)}</span>
                          {qty > 1 && (
                            <span className="price-each">${price.toFixed(2)} each</span>
                          )}
                        </div>
                        <button
                          className="remove-item-btn"
                          onClick={() => removeItem(item.id)}
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="cart-summary">
                  <div className="cart-summary-row">
                    <span>Subtotal</span>
                    <span>${total}</span>
                  </div>
                  <div className="cart-summary-row cart-summary-total">
                    <span>Total</span>
                    <span className="cart-total-price">${total}</span>
                  </div>
                  <p className="cart-note">Shipping & taxes calculated at checkout</p>
                </div>

                <div className="modal-footer">
                  <button
                    className="cart-btn cart-btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Continue Shopping
                  </button>
                  <button
                    className="cart-btn cart-btn-primary"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <span className="spinner"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-lock"></i>
                        Checkout
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      <button 
        className="cart-icon-btn" 
        onClick={() => setShowModal(!showModal)}
        aria-label="Open shopping cart"
      >
        <i className="fas fa-shopping-cart"></i>
        {cartItems.length > 0 && (
          <span className="cart-count">
            {cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)}
          </span>
        )}
      </button>
    </>
  );
};

const mapStateToProps = state => ({
  items: state.cart.items,
});

export default connect(mapStateToProps)(Cart);
