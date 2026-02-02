import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useDispatch } from 'react-redux';
import {
  CartProvider,
  useCart,
  CartCheckoutButton,
  useShop,
  ShopPayButton,
} from '@shopify/hydrogen-react';
import { createCheckout } from '../../services/shopifyService';
import './Cart.css';

const Cart = ({ items }) => {
  const [showModal, setShowModal] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [checkoutUrl, setCheckoutUrl] = useState('');
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
      const lineItems = cartItems.map(item => ({
        variantId: item.selectedVariant?.id || item.variants[0]?.id,
        quantity: item.quantity || 1,
      }));

      const checkout = await createCheckout(lineItems);

      if (checkout.webUrl) {
        window.location.href = checkout.webUrl;
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

    // Update Redux store
    dispatch({
      type: 'UPDATE_CART',
      payload: updatedItems.map(item => JSON.stringify(item)),
    });
  };

  const shop = useShop();
  console.log(shop);

  return (
    <CartProvider>
      {showModal && (
        <div className="modal">
          <div className="modal-content cart-modal">
            <div className="modal-header">
              <h2>Shopping Cart</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <p>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="cart-items-container">
                  {cartItems.map((item, index) => {
                    const variant = item.selectedVariant || item.variants[0];
                    const qty = item.quantity || 1;
                    const price = parseFloat(variant?.price?.amount || 0);

                    return (
                      <div className="cart-main" key={index}>
                        <button
                          className="remove-item-btn"
                          onClick={() => removeItem(item.id)}
                          title="Remove item"
                        >
                          &times;
                        </button>
                        <img src={item.images[0]?.src} alt={item.title} />
                        <div className="cart-item-details">
                          <h3 className="cart-title">{item.title}</h3>
                          {variant?.title &&
                            variant.title !== 'Default Title' && (
                              <p className="cart-variant">{variant.title}</p>
                            )}
                          <div className="cart-quantity-controls">
                            <button
                              onClick={() => updateQuantity(item.id, qty - 1)}
                              className="qty-btn"
                            >
                              -
                            </button>
                            <span className="qty-display">{qty}</span>
                            <button
                              onClick={() => updateQuantity(item.id, qty + 1)}
                              className="qty-btn"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="cart-item-price">
                          <h3>${(price * qty).toFixed(2)}</h3>
                          {qty > 1 && (
                            <p className="unit-price">
                              ${price.toFixed(2)} each
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="cart-footer">
                  <h3>Total: ${total}</h3>
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
                    {isProcessing ? 'Processing...' : 'Checkout'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="cart" onClick={() => setShowModal(!showModal)}>
        <i className="fas fa-shopping-cart"></i>
        {cartItems.length > 0 && (
          <span className="cart-count">
            {cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)}
          </span>
        )}
      </div>
    </CartProvider>
  );
};

const mapStateToProps = state => ({
  items: state.cart.items,
});

export default connect(mapStateToProps)(Cart);
