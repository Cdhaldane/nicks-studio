import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ParallaxProvider } from "react-scroll-parallax";
import { AlertProvider } from "./components/Alert/AlertProvider";
import Alert from "./components/Alert/Alert";
import Client from "shopify-buy";

// Import your components here
import Home from "./components/Home";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar/Navbar.jsx";
import Bio from "./components/Bio";
import Shop from "./components/Shop/Shop.jsx";
// import Gallery from './components/Gallery';
// import About from './components/About';
// import Contact from './components/Contact';
// import NotFound from './components/NotFound';

import "./App.css";

const Providers = () => {
  return (
    <AlertProvider>
      <App />
    </AlertProvider>
  );
};

function App() {
  return (
    <AlertProvider>
      <Alert />
      <ParallaxProvider>
        <Router>
          <div className="main">
            {window.location !== "/home" && <Navbar />}
            <Routes>
              <Route path="/nicks-studio" element={<Home />} />
              <Route path="/bio" element={<Bio />} />
              <Route path="/shop" element={<Shop />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </ParallaxProvider>
    </AlertProvider>
  );
}

export default App;
