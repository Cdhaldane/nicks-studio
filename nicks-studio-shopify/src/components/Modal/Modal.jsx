import React, { useState, useEffect } from "react";
import "./Modal.css"; // Import your CSS here

function Modal({ isOpen, onClose, product, onExecute }) {
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.className === "modal") {
        onClose();
      }
    };
    window.addEventListener("click", handleClickOutside);
  }, []);
  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{product.title}</h2>
          <h2>${product.variants[0].price.amount}</h2>
        </div>
        <div className="modal-main">
          <img
            src={product.images[0].src}
            alt={product.title}
            className="item-image"
          />
        </div>
        <div className="modal-footer">
          <button className="btn red br-left" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn green br-right"
            onClick={() => onExecute(product)}
          >
            Add To Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
