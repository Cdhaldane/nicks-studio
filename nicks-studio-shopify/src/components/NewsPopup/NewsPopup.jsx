import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import './NewsPopup.css';

const NewsPopup = ({ forceShow = false, onForceClose = null }) => {
  const [hasVisited, setHasVisited] = useLocalStorage('hasVisitedSite', false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Show popup if forced to show or if user hasn't visited before
    if (forceShow || !hasVisited) {
      // Small delay to ensure page has loaded
      const timer = setTimeout(
        () => {
          setShowPopup(true);
        },
        forceShow ? 100 : 1000
      );

      return () => clearTimeout(timer);
    }
  }, [hasVisited, forceShow]);

  const handleClose = () => {
    setShowPopup(false);
    if (!forceShow) {
      setHasVisited(true);
    }
    if (onForceClose) {
      onForceClose();
    }
  };

  const handleBackdropClick = e => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!showPopup) return null;

  return (
    <div className="news-popup-overlay" onClick={handleBackdropClick}>
      <div className="news-popup-content">
        <button className="news-popup-close" onClick={handleClose}>
          ×
        </button>
        <div className="news-popup-image">
          {/* Replace with your actual news image */}
          <img
            src={`${process.env.PUBLIC_URL}/nick_tour.jpg`}
            alt="Latest News"
            onError={e => {
              // Fallback to a default image if the specific news image doesn't exist
              e.target.src = `${process.env.PUBLIC_URL}/optimized/n1-large.jpg`;
            }}
          />
        </div>
        <div className="news-popup-content-text">
          <h2>🎵 Tour Dates Announced!</h2>
          <p>
            Don't miss Nickola Magnolia live! Check out the tour schedule above
            and get your tickets now.
          </p>
          <div className="news-popup-buttons">
            <a
              href="https://www.ticketmaster.com"
              target="_blank"
              rel="noopener noreferrer"
              className="news-btn primary"
              onClick={() => {
                // Optional: Track click for analytics
                console.log('Tour tickets link clicked');
                handleClose();
              }}
            >
              Get Tickets 🎫
            </a>
            <button className="news-btn secondary" onClick={handleClose}>
              View Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsPopup;
