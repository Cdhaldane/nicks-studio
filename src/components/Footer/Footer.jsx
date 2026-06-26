import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SOCIAL_MEDIA, NAVIGATION_ITEMS } from '../../utils/constants';
import { validateEmail } from '../../utils/helpers';
import './Footer.css';
import vercelEmailStorageService from '../../services/vercelEmailStorageService';
import BookingForm from '../BookingForm/BookingForm';
import '../Modal/Modal.css';

function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  // Social links are managed in the admin panel; SOCIAL_MEDIA is the fallback
  // used until the admin data loads (or if the request fails).
  const [socialLinks, setSocialLinks] = useState(SOCIAL_MEDIA);
  const [showBooking, setShowBooking] = useState(false);
  const location = useLocation();

  // Close the booking modal on Escape.
  useEffect(() => {
    if (!showBooking) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowBooking(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showBooking]);

  useEffect(() => {
    let cancelled = false;

    vercelEmailStorageService
      .getSocialStats()
      .then((data) => {
        if (cancelled || !data || !Array.isArray(data.platforms)) return;

        const links = data.platforms
          .filter((p) => p.active && p.url && p.icon)
          .map((p) => ({ platform: p.id, url: p.url, icon: p.icon, label: p.name }));

        // Only override the hardcoded fallback when admin data has usable links.
        if (links.length > 0) setSocialLinks(links);
      })
      .catch(() => {
        /* keep the SOCIAL_MEDIA fallback */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await vercelEmailStorageService.addSubscriber(email);
      
      if (result.success) {
        setIsSubscribed(true);
        setMessage('Thank you for subscribing! 🎵');
        setMessageType('success');
        setEmail('');
        
        // Log success for debugging
        console.log('Newsletter subscription successful:', result.subscriber);
        
        // Optional: Reset success message after a delay
        setTimeout(() => {
          setMessage('');
        }, 5000);
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setMessage('Something went wrong. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderNavLinks = () => {
    return NAVIGATION_ITEMS.filter(item => !item.external).map((item) => (
      <Link
        key={item.path}
        to={item.path}
        className={`footer-nav-link ${location.pathname === item.path ? 'active' : ''}`}
      >
        {item.label}
      </Link>
    ));
  };

  const renderSocialLinks = () => {
    return socialLinks.map(({ platform, url, icon, label }) => (
      <a
        key={platform}
        href={url}
        className="social-button"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
      >
        <i className={icon}></i>
      </a>
    ));
  };

  const currentYear = new Date().getFullYear();

  return (
    <>
    <footer className="footer">
      <div className="footer-container">
        {/* Header Section */}
        <div className="footer-header">
          <h2 className="footer-title">Nickola Magnolia</h2>
          <p className="footer-tagline">
            Intertwining classic Country melodies with intimate Rock and Americana influences from the shores of the Great Lakes.
          </p>
          <button
            type="button"
            className="footer-booking-btn"
            onClick={() => setShowBooking(true)}
          >
            <i className="fa-solid fa-microphone-lines" aria-hidden="true" />
            Booking Inquiries
          </button>
        </div>

        {/* Links Section */}
        <div className="footer-links">
          {/* <nav className="footer-nav">
            {renderNavLinks()}
            <a 
              href="https://www.youtube.com/channel/UC18RGyNPiUxzPAEUFNuvH_Q"
              className="footer-nav-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch
            </a>
            <a 
              href="https://www.instagram.com/direct/t/100599608092241"
              className="footer-nav-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact
            </a>
          </nav> */}

          {/* Newsletter Section */}
          <div className="footer-newsletter">
            <h3 className="footer-newsletter-title">Stay Connected</h3>
            <p className="footer-newsletter-text">
              Get the latest updates on new music, shows, and exclusive content.
            </p>
            {!isSubscribed ? (
              <form className="footer-newsletter-form" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  className="footer-newsletter-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  className="footer-newsletter-button"
                  disabled={isLoading || !email.trim()}
                >
                  {isLoading ? 'Joining...' : 'Join'}
                </button>
              </form>
            ) : (
              <div className="footer-newsletter-success">
                <p style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                  Thank you for subscribing! 🎵
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>
                  You'll receive updates about new music and shows.
                </p>
              </div>
            )}
            
            {/* Message Display */}
            {message && !isSubscribed && (
              <p 
                className={`footer-newsletter-message ${messageType}`}
                style={{ 
                  color: messageType === 'error' ? 'var(--error)' : 'var(--success)',
                  fontSize: 'var(--font-size-sm)',
                  marginTop: 'var(--space-sm)',
                  fontWeight: '500'
                }}
              >
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Social Media Section */}
        <div className="footer-socials">
          {renderSocialLinks()}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="footer-bottom">
        <p className="footer-copy">
          © {currentYear} Nickola Magnolia. All rights reserved.
        </p>
        <div className="footer-legal">
          <Link to="/privacy" className="footer-legal-link">Privacy Policy</Link>
          <Link to="/terms" className="footer-legal-link">Terms of Service</Link>
          <Link to="/accessibility" className="footer-legal-link">Accessibility</Link>
        </div>
      </div>
    </footer>

    {showBooking && (
      <div
        className="modal"
        onClick={(e) => { if (e.target === e.currentTarget) setShowBooking(false); }}
        role="dialog"
        aria-modal="true"
        aria-label="Booking request form"
      >
        <div className="modal-content booking-modal-content">
          <div className="modal-header">
            <h2 className="modal-title">Booking Requests</h2>
            <button
              className="modal-close"
              onClick={() => setShowBooking(false)}
              aria-label="Close booking form"
            >
              &times;
            </button>
          </div>
          <div className="booking-modal-body">
            <BookingForm />
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default Footer;
