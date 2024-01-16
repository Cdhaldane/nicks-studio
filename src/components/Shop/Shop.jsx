import React, { useState, useEffect } from "react";
import Client from "shopify-buy";
import "./Shop.css";

// Initialize Shopify client
const client = Client.buildClient({
  domain: "nickolamagnolia.myshopify.com",
  storefrontAccessToken: "8e7e244e6bb1154a85685231573b7d3f",
});

function Shop() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await client.product.fetchAll();
      console.log("Products:", response);
      setProducts(response);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  return (
    <div className="shop-container">
      <div className="stack drop-in shop-stack" style={{ "--stacks": 3 }}>
        <span style={{ "--index": 0 }}>MERCHANDISE</span>
        <span className="bio-back">MERCHANDISE</span>
        <span style={{ "--index": 1 }}>MERCHANDISE</span>
        <span style={{ "--index": 2 }}>MERCHANDISE</span>
      </div>
      <div className="shop-main">
        {products.map((product) => (
          <div key={product.id} className="shop-item">
            <img
              src={product.images[0].src}
              alt={product.title}
              className="item-image"
            />
            <h3 className="item-title">{product.title}</h3>
            {/* <p className="item-description">{product.description}</p> */}
            <p className="item-price">${product.variants[0].price.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Shop;
