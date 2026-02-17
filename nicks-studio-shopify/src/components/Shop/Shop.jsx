import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import { useDispatch } from 'react-redux';
import { connect } from 'react-redux';
import { useAlert } from '../Alert/AlertProvider';
import SEOHelmet from '../SEO/SEOHelmet';
import { BreadcrumbSchema } from '../SEO/StructuredData';
import { fetchAllProducts } from '../../services/squareService';
import './Shop.css';
import { Parallax } from 'react-scroll-parallax';

function Shop({ items }) {
  const [products, setProducts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const { showAlert } = useAlert();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const fetchedProducts = await fetchAllProducts();
      console.log('Fetched products:', fetchedProducts);
      setProducts(fetchedProducts);
      setError(null);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
      showAlert('error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const onClose = () => {
    setIsOpen(false);
  };

  const addToCart = item => {
    console.log(items);
    if (items.length > 0) {
      const cartItems = items.map(item => JSON.parse(item));
      console.log(cartItems);
      if (cartItems.find(cartItem => cartItem.id === item.id)) {
        showAlert('error', 'Item already in cart!');
        onClose();
        return;
      }
    }

    dispatch({
      type: 'ADD_TO_CART',
      payload: JSON.stringify(item),
    });
    onClose();
  };
  if (loading) {
    return (
      <div className="shop-container">
        <div className="loading"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shop-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadProducts} className="btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

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
          { name: 'Home', url: window.location.origin },
          { name: 'Shop', url: `${window.location.origin}/shop` },
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
          {products.length === 0 ? (
            <div className="no-products">
              <p>No products available at the moment.</p>
            </div>
          ) : (
            products.map(product => (
              <div
                key={product.id}
                className="shop-item"
                onClick={() => {
                  setIsOpen(true);
                  setSelectedProduct(product);
                }}
              >
                <div className="item-image-wrapper">
                  <img
                    src={product.images[0]?.src}
                    alt={product.title}
                    className="item-image"
                    loading="lazy"
                  />
                  {product.variants[0]?.available === false && (
                    <div className="sold-out-badge">Sold Out</div>
                  )}
                </div>
                <h3 className="item-title">{product.title}</h3>
                <p className="item-price">
                  ${parseFloat(product.variants[0]?.price?.amount).toFixed(2)}
                </p>
                {product.variants.length > 1 && (
                  <p className="variant-count">
                    {product.variants.length} variants
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        product={selectedProduct}
        onExecute={item => addToCart(item)}
      />
    </>
  );
}

const mapStateToProps = state => ({
  items: state.cart.items,
});

export default connect(mapStateToProps)(Shop);
