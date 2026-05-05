import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

/**
 * Lightweight page view tracker.
 * Fires once per route change, skips admin pages.
 * No cookies, no PII, no fingerprinting.
 */
const usePageTracking = () => {
  const location = useLocation();
  const lastTracked = useRef(null);

  useEffect(() => {
    // Don't track admin page
    if (location.pathname === '/admin') return;

    // Don't double-track same path
    if (lastTracked.current === location.pathname) return;
    lastTracked.current = location.pathname;

    const payload = {
      page: location.pathname,
      referrer: document.referrer || null,
    };

    // Use sendBeacon for reliability, fall back to fetch
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const sent = navigator.sendBeacon?.(`${API_BASE}/analytics`, blob);

    if (!sent) {
      fetch(`${API_BASE}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => { /* silent fail — analytics should never break UX */ });
    }
  }, [location.pathname]);
};

export default usePageTracking;
