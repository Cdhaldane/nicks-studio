import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const params = new URLSearchParams(location.search);
  const orderId = params.get('orderId') || params.get('checkoutId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(!!orderId);
  const [error, setError] = useState(null);

  // Clear the cart on successful landing
  useEffect(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, [dispatch]);

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/square-order?id=${encodeURIComponent(orderId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.message || data.error);
        setOrder(data.order ?? data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  const formatMoney = (amount, currency = 'CAD') => {
    const dollars = Number(amount) / 100;
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(dollars);
  };

  return (
    <>
      <SEOHelmet
        title="Order Confirmed | Nickola Magnolia"
        description="Your order has been placed successfully."
        noIndex
      />
      <div className="order-confirmation-container">
        {loading && (
          <div className="oc-loading">
            <div className="oc-spinner" />
            <p>Loading your order…</p>
          </div>
        )}

        {!loading && (
          <div className="oc-card">
            <div className="oc-hero">
              <div className="oc-checkmark">✓</div>
              <h1>Order Confirmed!</h1>
              <p className="oc-subtitle">
                Thank you for your purchase. You'll receive a confirmation email shortly.
              </p>
            </div>

            {error && (
              <div className="oc-notice">
                <p>We couldn't load your order details right now, but your order was placed successfully.</p>
              </div>
            )}

            {order && !error && (
              <div className="oc-details">
                <div className="oc-section">
                  <h2>Order Summary</h2>
                  {orderId && (
                    <p className="oc-order-id">
                      Order ID: <span>{orderId}</span>
                    </p>
                  )}
                  {order.lineItems?.length > 0 && (
                    <ul className="oc-items">
                      {order.lineItems.map((item, i) => (
                        <li key={i} className="oc-item">
                          <span className="oc-item-name">
                            {item.name}
                            <em className="oc-item-qty"> × {item.quantity}</em>
                          </span>
                          <span className="oc-item-price">
                            {item.totalMoney
                              ? formatMoney(item.totalMoney.amount, item.totalMoney.currency)
                              : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {order.totalMoney && (
                    <div className="oc-total">
                      <span>Total</span>
                      <span>{formatMoney(order.totalMoney.amount, order.totalMoney.currency)}</span>
                    </div>
                  )}
                </div>

                {order.fulfillments?.[0]?.shipmentDetails?.recipient && (
                  <div className="oc-section">
                    <h2>Shipping To</h2>
                    {(() => {
                      const r = order.fulfillments[0].shipmentDetails.recipient;
                      const a = r.address;
                      return (
                        <address className="oc-address">
                          <strong>{r.displayName}</strong>
                          {a?.addressLine1 && <span>{a.addressLine1}</span>}
                          {a?.addressLine2 && <span>{a.addressLine2}</span>}
                          {a?.locality && (
                            <span>
                              {a.locality}, {a.administrativeDistrictLevel1} {a.postalCode}
                            </span>
                          )}
                          {a?.country && <span>{a.country}</span>}
                        </address>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            <div className="oc-actions">
              <Link to="/shop" className="btn btn-primary oc-btn-shop">
                Continue Shopping
              </Link>
              <Link to="/" className="oc-btn-home">
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderConfirmation;
