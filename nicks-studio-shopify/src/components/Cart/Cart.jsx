import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import {
  CartProvider,
  useCart,
  CartCheckoutButton,
  useShop,
  ShopPayButton,
} from "@shopify/hydrogen-react";
import "./Cart.css";

const Cart = ({ items }) => {
  const [showModal, setShowModal] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [variantIds, setVariantIds] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setCartItems(items.map((item) => JSON.parse(item)));
  }, [items]);

  useEffect(() => {
    if (cartItems.length !== 0) {
      let outTotal = 0;
      let outIds = [];
      cartItems.map((item) => {
        outTotal += parseFloat(item.variants[0].price.amount);
        let quantity = 1;
        outIds.push({ id: item.variants[0].id, quantity });
      });
      console.log(outIds);
      setVariantIds(outIds);
      setTotal(outTotal.toFixed(2));
    }
  }, [cartItems]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.className === "modal") {
        setShowModal(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
  }, []);

  const shop = useShop();
  console.log(shop);

  return (
    <CartProvider>
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>CART</h2>
            </div>
            {cartItems.map((item, index) => (
              <div className="cart-main" key={index}>
                <img src={item.images[0].src} alt={item.title} />
                <h2 className="cart-title">{item.title}</h2>
                <h3>${item.variants[0].price.amount}</h3>
              </div>
            ))}
            <div className="cart-footer">
              <h3>Total: ${total}</h3>
            </div>
            <div className="modal-footer">
              <button
                className="btn red cart-button"
                onClick={() => setShowModal(false)}
              >
                No
              </button>
              {variantIds.length > 0 && (
                <ShopPayButton
                  storeDomain={"https://nickolamagnolia.myshopify.com"}
                  variantIdsAndQuantities={variantIds}
                  width="100%"
                  className="cart-button"
                />
              )}
            </div>
          </div>
        </div>
      )}
      <div className="cart" onClick={() => setShowModal(!showModal)}>
        <i className="fas fa-shopping-cart"></i>
        {cartItems.length > 0 && (
          <span className="cart-count">{items.length}</span>
        )}
      </div>
    </CartProvider>
  );
};

const mapStateToProps = (state) => ({
  items: state.cart.items,
});

export default connect(mapStateToProps)(Cart);
