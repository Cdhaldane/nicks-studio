import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import vercelEmailStorageService from '../../services/vercelEmailStorageService';
import './NewsPopup.css';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const NewsPopup = ({ forceShow = false, onForceClose = null }) => {
  const [hasSeenSignup, setHasSeenSignup] = useLocalStorage('hasSeenEmailSignup', false);
  const [showPopup, setShowPopup] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState(null);

  useEffect(() => {
    vercelEmailStorageService.getPopupImage().then(url => { if (url) setHeroImageUrl(url); });
  }, []);

  useEffect(() => {
    if (forceShow || !hasSeenSignup) {
      const timer = setTimeout(() => setShowPopup(true), forceShow ? 100 : 1500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenSignup, forceShow]);

  const handleClose = () => {
    setShowPopup(false);
    if (!forceShow) setHasSeenSignup(true);
    if (onForceClose) onForceClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrorMessage('');
    const result = await vercelEmailStorageService.addSubscriber(email, 'popup');
    if (result.success) {
      setStatus('success');
      if (!forceShow) setHasSeenSignup(true);
    } else {
      setStatus('error');
      setErrorMessage(result.message || 'Something went wrong. Please try again.');
    }
  };

  if (!showPopup) return null;

  return (
    <div className="news-popup-overlay" onClick={handleBackdropClick}>
      <div
        className="news-popup-content email-signup-popup"
        role="dialog"
        aria-modal="true"
        aria-label="Newsletter signup"
      >
        <button className="news-popup-close" onClick={handleClose} aria-label="Close">×</button>

        {status === 'success' ? (
          <div className="signup-success">
            <div className="success-icon">🎵</div>
            <h2>You're in!</h2>
            <p>Thanks for subscribing. We'll keep you posted on new music, tour dates, and more.</p>
            <button className="news-btn primary" onClick={handleClose}>Let's Go!</button>
          </div>
        ) : (
          <>
            <div className="news-popup-image">
              <img
                src={heroImageUrl || `${process.env.PUBLIC_URL}/06_11.jpg`}
                alt="Nickola Magnolia"
                onError={e => { e.target.src = `${process.env.PUBLIC_URL}/optimized/n1-large.jpg`; }}
              />
            </div>
            <div className="news-popup-content-text">
              <h2>Stay in the Loop 🎶</h2>
              <p>Get exclusive updates on new music, tour dates, and behind-the-scenes content — straight to your inbox.</p>
              <form className="signup-form" onSubmit={handleSubmit} noValidate>
                <div className="input-row">
                  <input
                    type="email"
                    className="email-input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    disabled={status === 'loading'}
                    aria-label="Email address"
                    required
                  />
                  <button
                    type="submit"
                    className={`news-btn primary submit-btn${status === 'loading' ? ' loading' : ''}`}
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? '...' : 'Subscribe'}
                  </button>
                </div>
                {status === 'error' && (
                  <p className="signup-error" role="alert">{errorMessage}</p>
                )}
              </form>
              <button className="no-thanks-btn" onClick={handleClose}>No thanks</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NewsPopup;
