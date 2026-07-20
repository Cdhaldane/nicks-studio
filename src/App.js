import React from 'react';
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
import AdminPage from './views/Admin/AdminPage.jsx';
import OrderConfirmation from './views/OrderConfirmation/OrderConfirmation.jsx';
import Footer from './components/Footer/Footer.jsx';
import Navbar from './components/Navbar/Navbar.jsx';
import NewsPopup from './components/NewsPopup/NewsPopup.jsx';
import AnnouncementPopup from './components/Announcement/AnnouncementPopup.jsx';

import usePageTracking from './hooks/usePageTracking';

import './App.css';
import './Styles-Mobile.css';

function App() {
  const location = useLocation();
  usePageTracking();

  return (
    <HelmetProvider>
      <AuthProvider>

        <AlertProvider>
          <Alert />
          <NewsPopup />
          <AnnouncementPopup />
          <ParallaxProvider>
            <div
              className="main"
              style={{
                backgroundImage:
                  location.pathname !== '/' &&
                  location.pathname !== '/admin' &&
                  `url(${process.env.PUBLIC_URL}/optimized/n1-large.jpg)`,
              }}
            >
              {location.pathname !== '/admin' && location.pathname !== '/order-confirmation' && <Navbar />}
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/music" element={<Music />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/accessibility" element={<Accessibility />} />
                <Route path="/admin" element={<AdminPage />} />
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
