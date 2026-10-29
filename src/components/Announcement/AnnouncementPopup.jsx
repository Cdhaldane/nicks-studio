import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import useDialog from '../../hooks/useDialog';
import vercelEmailStorageService from '../../services/vercelEmailStorageService';
import './AnnouncementPopup.css';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * Site-wide announcement modal. Content (title, description, ticket link) is
 * edited from the admin dashboard's Announcement tab and stored via
 * /api/admin?resource=announcement. Dismissal is remembered per updatedAt, so
 * saving a new announcement in the admin shows it to everyone again.
 */
const AnnouncementPopup = () => {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState(null);
  const [dismissedAt, setDismissedAt] = useLocalStorage('announcementDismissedAt', null);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [signupStatus, setSignupStatus] = useState('idle'); // idle | loading | success | error
  const [signupError, setSignupError] = useState('');

  useEffect(() => {
    vercelEmailStorageService.getAnnouncement().then((data) => {
      if (data?.enabled && data.title) setAnnouncement(data);
    });
  }, []);

  useEffect(() => {
    if (!announcement || dismissedAt === announcement.updatedAt) return undefined;

    // This used to wait for NewsPopup to close on a first visit, but NewsPopup
    // is no longer mounted (App.js), so first-time visitors never saw this.
    // If NewsPopup comes back, sequence the two again via its
    // 'news-popup-closed' event so they don't stack.
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [announcement, dismissedAt]);

  const handleClose = () => {
    setVisible(false);
    setDismissedAt(announcement.updatedAt);
  };

  const isHiddenRoute = location.pathname === '/admin' || location.pathname === '/order-confirmation';
  const dialogRef = useDialog(Boolean(announcement) && visible && !isHiddenRoute, handleClose);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setSignupError('Please enter a valid email address.');
      setSignupStatus('error');
      return;
    }
    setSignupStatus('loading');
    setSignupError('');
    const result = await vercelEmailStorageService.addSubscriber(email, 'announcement-popup');
    if (result.success) {
      setSignupStatus('success');
    } else {
      setSignupStatus('error');
      setSignupError(result.message || 'Something went wrong. Please try again.');
    }
  };

  if (!announcement) return null;
  if (isHiddenRoute) return null;

  if (!visible) {
    // Floating icon button (replaces the old "New Album" text trigger) so
    // visitors can reopen the announcement after dismissing it.
    return (
      <button
        className="announcement-trigger"
        onClick={() => setVisible(true)}
        aria-label="View announcement"
        title={announcement.title}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 11l18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      </button>
    );
  }

  return (
    <div className="announcement-overlay" onClick={handleBackdropClick}>
      <div
        className={`announcement-content${announcement.imageUrl ? ' has-image' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Announcement"
        ref={dialogRef}
      >
        <button className="announcement-close" onClick={handleClose} aria-label="Close">×</button>
        {announcement.imageUrl && (
          <div className="announcement-image">
            <img
              src={announcement.imageUrl}
              alt={announcement.title}
              onError={(e) => { e.target.parentElement.style.display = 'none'; }}
            />
          </div>
        )}
        <div className="announcement-body">
          {announcement.eyebrow && <span className="announcement-eyebrow">{announcement.eyebrow}</span>}
          <h2 className="announcement-title">{announcement.title}</h2>
          {announcement.description && (
            <p className="announcement-description">{announcement.description}</p>
          )}
          {announcement.linkUrl && (
            <a
              className="announcement-cta"
              href={announcement.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
            >
              {announcement.linkText || 'Learn More'}
            </a>
          )}
          {announcement.showSignup && (
            <form className="announcement-signup" onSubmit={handleSubscribe} noValidate>
              <label className="announcement-signup-label" htmlFor="announcement-email">
                Get shows and new music in your inbox
              </label>
              {signupStatus === 'success' ? (
                <p className="announcement-signup-success">
                  You're on the list — see you at the show!
                </p>
              ) : (
                <>
                  <div className="announcement-signup-row">
                    <input
                      id="announcement-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (signupStatus === 'error') setSignupStatus('idle');
                      }}
                      disabled={signupStatus === 'loading'}
                      required
                    />
                    <button type="submit" disabled={signupStatus === 'loading'}>
                      {signupStatus === 'loading' ? '...' : 'Subscribe'}
                    </button>
                  </div>
                  {signupStatus === 'error' && signupError && (
                    <p className="announcement-signup-error" role="alert">{signupError}</p>
                  )}
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPopup;
