import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import ProductDialog from '../../components/ProductDialog/ProductDialog';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import { BreadcrumbSchema } from '../../components/SEO/StructuredData';
import { fetchAllProducts } from '../../services/squareService';
import { formatPrice, toCartLine } from '../../utils/cart';
import './Shop.css';

const SORT_OPTIONS = [
  { value: 'default', label: 'Featured' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'name-asc', label: 'Alphabetical, A–Z' },
  { value: 'name-desc', label: 'Alphabetical, Z–A' },
];

const SKELETON_CARDS = 6;

const variantPrice = variant => Number(variant?.price?.amount) || 0;

/** Lowest price across a product's variants — what "From $X" and price sorting use. */
const minPrice = product => {
  const prices = product.variants.map(variantPrice).filter(price => price > 0);
  return prices.length ? Math.min(...prices) : 0;
};

const isSoldOut = product => product.variants.every(variant => variant.available === false);

const priceLabel = product => {
  const currency = product.variants[0]?.price?.currencyCode;
  const prices = new Set(product.variants.map(variantPrice));
  const low = formatPrice(minPrice(product), currency);
  return prices.size > 1 ? `From ${low}` : low;
};

function ProductCard({ product, onOpen }) {
  const [primary, secondary] = product.images;
  const soldOut = isSoldOut(product);
  return (
    <li className={`product-card${soldOut ? ' is-sold-out' : ''}`}>
      <button type="button" className="product-card-button" onClick={() => onOpen(product)}>
        <span className="product-card-media">
          <img src={primary?.src} alt={product.title} loading="lazy" className="product-card-image" />
          {/* Second photo fades in on hover, like most merch stores. */}
          {secondary && (
            <img src={secondary.src} alt="" aria-hidden="true" loading="lazy" className="product-card-image is-alt" />
          )}
          {soldOut && <span className="product-badge">Sold out</span>}
        </span>
        <span className="product-card-body">
          <span className="product-card-title">{product.title}</span>
          <span className="product-card-price">{priceLabel(product)}</span>
          {product.variants.length > 1 && (
            <span className="product-card-meta">{product.variants.length} options</span>
          )}
        </span>
      </button>
    </li>
  );
}

function Shop() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const dispatch = useDispatch();

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setProducts(await fetchAllProducts());
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('We couldn’t load the store right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const visibleProducts = useMemo(() => {
    let result = [...products];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        p => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => minPrice(a) - minPrice(b));
        break;
      case 'price-desc':
        result.sort((a, b) => minPrice(b) - minPrice(a));
        break;
      case 'name-asc':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'name-desc':
        result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      default:
        break;
    }
    return result;
  }, [products, searchQuery, sortBy]);

  const addToCart = (product, variant, quantity) => {
    // The reducer merges repeat adds of the same variant and opens the cart drawer.
    dispatch({ type: 'ADD_TO_CART', payload: toCartLine(product, variant, quantity) });
    setSelectedProduct(null);
  };

  const renderGrid = () => {
    if (loading) {
      return (
        <ul className="product-grid" aria-busy="true" aria-label="Loading products">
          {Array.from({ length: SKELETON_CARDS }, (_, i) => (
            <li key={i} className="product-card is-skeleton" aria-hidden="true">
              <span className="product-card-media" />
              <span className="skeleton-line" />
              <span className="skeleton-line is-short" />
            </li>
          ))}
        </ul>
      );
    }
    if (error) {
      return (
        <div className="shop-state">
          <i className="fa-solid fa-store-slash" aria-hidden="true" />
          <h2>{error}</h2>
          <p>Please check your connection and try again.</p>
          <button type="button" className="shop-button" onClick={loadProducts}>
            Try again
          </button>
        </div>
      );
    }
    if (visibleProducts.length === 0) {
      return (
        <div className="shop-state">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <h2>{searchQuery ? `Nothing matches “${searchQuery}”` : 'New merch is on the way'}</h2>
          <p>{searchQuery ? 'Try a different search.' : 'Check back soon.'}</p>
          {searchQuery && (
            <button type="button" className="shop-button is-quiet" onClick={() => setSearchQuery('')}>
              Clear search
            </button>
          )}
        </div>
      );
    }
    return (
      <ul className="product-grid">
        {visibleProducts.map(product => (
          <ProductCard key={product.id} product={product} onOpen={setSelectedProduct} />
        ))}
      </ul>
    );
  };

  return (
    <>
      <SEOHelmet
        title="Shop - Nickola Magnolia | Official Merchandise"
        description="Official Nickola Magnolia merchandise — t-shirts, hoodies, vinyl, and record release keepsakes. Support the independent alt-country and outlaw soul artist from Northumberland County, Ontario."
        keywords="Nickola Magnolia merchandise, country music merch, band t-shirts, vinyl records, artist shop, alt-country merch, country music Ontario live"
        url={window.location.href}
        type="website"
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: window.location.origin },
          { name: 'Shop', url: `${window.location.origin}/shop` },
        ]}
      />

      <div className="shop-page">
        <section className="shop-surface" aria-labelledby="shop-title">
          <header className="shop-header">
            <div className="shop-heading">
              <p className="shop-eyebrow">Official store</p>
              <h1 id="shop-title" className="shop-title">Merch</h1>
            </div>
            <div className="shop-controls">
              <div className="shop-search">
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  aria-label="Search products"
                />
              </div>
              <label className="shop-sort">
                <span className="sr-only">Sort by</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down" aria-hidden="true" />
              </label>
            </div>
          </header>

          {!loading && !error && (
            <p className="shop-count" aria-live="polite">
              {searchQuery
                ? `${visibleProducts.length} result${visibleProducts.length === 1 ? '' : 's'}`
                : `${products.length} product${products.length === 1 ? '' : 's'}`}
            </p>
          )}

          {renderGrid()}
        </section>
      </div>

      <ProductDialog
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
    </>
  );
}

export default Shop;
