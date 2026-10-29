import React, { lazy, Suspense } from 'react';
import {
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import { ParallaxProvider } from 'react-scroll-parallax';
import { HelmetProvider } from 'react-helmet-async';
import { AlertProvider } from './components/Alert/AlertProvider';
import { AuthProvider } from './contexts/AuthContext';
import Alert from './components/Alert/Alert';
import Home from './views/Home/Home';
import About from './views/About/Bio.jsx';
import Shop from './views/Shop/Shop.jsx';
import Music from './views/Music/Music.jsx';
import Privacy from './views/Privacy/Privacy.jsx';
import Terms from './views/Terms/Terms.jsx';
import Accessibility from './views/Accessibility/Accessibility.jsx';
import OrderConfirmation from './views/OrderConfirmation/OrderConfirmation.jsx';
import Footer from './components/Footer/Footer.jsx';
import Navbar from './components/Navbar/Navbar.jsx';
import AnnouncementPopup from './components/Announcement/AnnouncementPopup.jsx';

import './App.css';
import './Styles-Mobile.css';

// Only the site owner uses the dashboard, so it (and its stylesheet) is split
// out of the bundle every visitor downloads.
const AdminPage = lazy(() => import('./views/Admin/AdminPage.jsx'));

// The CSS reduced-motion rule can't reach react-scroll-parallax's JS transforms.
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function App() {
  // Page views are tracked by GA4 (public/index.html), whose enhanced
  // measurement picks up client-side route changes on its own.
  const location = useLocation();

  return (
    <HelmetProvider>
      <AuthProvider>

        <AlertProvider>
          <Alert />
          {/* NewsPopup is retired; see AnnouncementPopup before bringing it back. */}
          <AnnouncementPopup />
          <ParallaxProvider isDisabled={prefersReducedMotion}>
            <div
              className="main"
              style={{
                backgroundImage:
                  location.pathname !== '/' &&
                  location.pathname !== '/admin' &&
                  `url(${process.env.PUBLIC_URL}/optimized/n1-large.jpg)`,
              }}
            >
              {location.pathname !== '/admin' && location.pathname !== '/order-confirmation' && (
                <>
                  <a href="#main-content" className="skip-to-content">
                    Skip to content
                  </a>
                  <Navbar />
                </>
              )}
              {/* Skip-link target: zero-size, so it doesn't affect the flex layout. */}
              <div id="main-content" tabIndex={-1} />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/music" element={<Music />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/accessibility" element={<Accessibility />} />
                <Route
                  path="/admin"
                  element={
                    <Suspense fallback={null}>
                      <AdminPage />
                    </Suspense>
                  }
                />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
              </Routes>
              {location.pathname !== '/' &&
                location.pathname !== '/admin' &&
                location.pathname !== '/order-confirmation' && <Footer />}
            </div>
          </ParallaxProvider>
        </AlertProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
