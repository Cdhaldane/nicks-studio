import React, { useState, useEffect } from "react";
import Client from "shopify-buy";
import Modal from "../Modal/Modal";
import { useDispatch } from "react-redux";
import { connect } from "react-redux";
import { useAlert } from "../Alert/AlertProvider";
import SEOHelmet from "../SEO/SEOHelmet";
import { BreadcrumbSchema } from "../SEO/StructuredData";
import "./Shop.css";
import { Parallax } from "react-scroll-parallax";

// Initialize Shopify client
const client = Client.buildClient({
  domain: "nickolamagnolia.myshopify.com",
  storefrontAccessToken: "8e7e244e6bb1154a85685231573b7d3f",
});

function Shop({ items }) {
  const [products, setProducts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchProducts().then(() => setLoading(false));
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await client.product.fetchAll();
      setProducts(response);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const onClose = () => {
    setIsOpen(false);
  };

  const addToCart = (item) => {
    console.log(items);
    if (items.length > 0) {
      const cartItems = items.map((item) => JSON.parse(item));
      console.log(cartItems);
      if (cartItems.find((cartItem) => cartItem.id === item.id)) {
        showAlert("error", "Item already in cart!");
        onClose();
        return;
      }
    }

    dispatch({
      type: "ADD_TO_CART",
      payload: JSON.stringify(item),
    });
    onClose();
  };
  if (loading)
    return (
      <div className="shop-container">
        <div className="loading"></div>
      </div>
    );
  return (
    <>
      <SEOHelmet 
        title="Shop - Nickola Magnolia | Official Merchandise"
        description="Shop official Nickola Magnolia merchandise including t-shirts, hoodies, vinyl records, and more. Support your favorite Country & Americana artist from the Great Lakes."
        keywords="Nickola Magnolia merchandise, country music merch, band t-shirts, vinyl records, artist shop, americana merchandise"
        url={window.location.href}
        type="website"
      />
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: window.location.origin },
          { name: "Shop", url: `${window.location.origin}/shop` }
        ]}
      />
      
      <div className="shop-container">
        <Parallax speed={5}>
          {/* <div className="nav-title bio merch">
            <span>Merchandise</span>
            <span className="back">Merchandise</span>
          </div> */}
        </Parallax>
        <div className="shop-main">
          {products.map((product) => (
            <div
              key={product.id}
              className="shop-item"
              onClick={() => {
                setIsOpen(true);
                setSelectedProduct(product);
              }}
            >
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
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        product={selectedProduct}
        onExecute={(item) => addToCart(item)}
      />
    </>
  );
}

const mapStateToProps = (state) => ({
  items: state.cart.items,
});

export default connect(mapStateToProps)(Shop);
