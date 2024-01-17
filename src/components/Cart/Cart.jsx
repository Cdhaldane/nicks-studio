import React from "react";
import { connect } from "react-redux";
import { useAlert } from "../Alert/AlertProvider";

import "./Cart.css";

const Cart = ({ items }) => {
  const { showAlert } = useAlert();
  console.log(items);
  return (
    <div className="cart">
      <i className="fas fa-shopping-cart"></i>
      <span className="cart-count">{items.length}</span>
    </div>
  );
};

const mapStateToProps = (state) => ({
  items: state.cart.items,
});

export default connect(mapStateToProps)(Cart);
