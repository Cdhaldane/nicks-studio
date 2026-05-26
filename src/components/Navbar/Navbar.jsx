import React, { useState, useEffect, useCallback } from 'react';
import Cart from '../Cart/Cart';
import TourSchedule from '../TourSchedule/TourSchedule';
import '../Modal/Modal.css';
import './Navbar.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [width, setWidth] = useState(window.innerWidth);
  const [isOpen, setIsOpen] = useState(false);
  const [showTourDates, setShowTourDates] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isMobile = width <= 1250;

  // Derive active tab from current route
  const getActiveTab = (pathname) => {
    if (pathname === '/about') return 'about';
    if (pathname === '/music') return 'listen';
    if (pathname === '/shop') return 'shop';
    return 'home';
  };

  const active = getActiveTab(location.pathname);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      if (window.innerWidth > 1250) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isMobile]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close tour modal on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showTourDates) setShowTourDates(false);
        else if (isOpen) setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showTourDates, isOpen]);

  const handleTourToggle = useCallback(() => {
    setShowTourDates(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const navItems = [
    { to: '/about', label: 'About', key: 'about' },
    { to: '/music', label: 'Listen', key: 'listen' },
    { to: 'https://www.youtube.com/channel/UC18RGyNPiUxzPAEUFNuvH_Q', label: 'Watch', key: 'watch', external: true },
    { to: '/shop', label: 'Merchandise', key: 'shop' },
  ];

  const renderNavLink = (item, onClick) => (
    <Link
      key={item.key}
      to={item.to}
      className={`nav-button ${active === item.key ? 'active' : ''}`}
      onClick={onClick}
      {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {item.label}
    </Link>
  );

  const renderTourButton = (onClick) => (
    <button
      onClick={onClick}
      className="nav-button tour-nav-btn"
    >
      Tour Dates
    </button>
  );

  return (
    <>
      <div className={`nav-links ${isMobile ? 'nav-mobile' : 'nav-desktop'}`}>
        {/* Desktop: left links */}
        {!isMobile && (
          <>
            {navItems.slice(0, 3).map(item => renderNavLink(item))}
          </>
        )}

        {/* Title — always visible */}
        <div
          className={`nav-title ${isMobile ? 'mobile-title' : ''}`}
          onClick={() => navigate('/')}
        >
          
          {isMobile ? (
            <img
              src={`${process.env.PUBLIC_URL}/logo-init.png`}
              alt="Nickola Magnolia"
              className="nav-logo nav-logo-initials"
            />
          ) : (
            <img
              src={`${process.env.PUBLIC_URL}/logo-init.png`}
              alt="Nickola Magnolia"
              className="nav-logo nav-logo-full"
            />
          )}
        </div>

        {/* Desktop: right links */}
        {!isMobile && (
          <>
            {navItems.slice(3).map(item => renderNavLink(item))}
            {renderTourButton(handleTourToggle)}
          </>
        )}

        {/* Mobile: hamburger / close button */}
        {isMobile && (
          <button
            className={`nav-links-bars ${isOpen ? 'is-open' : ''}`}
            onClick={() => setIsOpen(prev => !prev)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            <i className={isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'}></i>
          </button>
        )}
      </div>

      {/* Mobile menu overlay + drawer */}
      {isMobile && (
        <>
          <div
            className={`mobile-overlay ${isOpen ? 'visible' : ''}`}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          <nav
            className={`mobile-drawer ${isOpen ? 'open' : ''}`}
            aria-label="Mobile navigation"
          >
            <div className="mobile-links">
              {navItems.map(item => renderNavLink(item, closeMobileMenu))}
              {renderTourButton(() => { closeMobileMenu(); handleTourToggle(); })}
            </div>
          </nav>
        </>
      )}

      <div className="nav-cart drop-in">
        <Cart />
      </div>

      {/* Tour Dates Modal */}
      {showTourDates && (
        <div
          className="modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTourDates(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Tour Dates"
        >
          <div className="modal-content tour-modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Tour Dates</h2>
              <button
                className="modal-close"
                onClick={() => setShowTourDates(false)}
                aria-label="Close tour dates"
              >
                &times;
              </button>
            </div>
            <div className="tour-modal-body">
              <TourSchedule showAsSection={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
