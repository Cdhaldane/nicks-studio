import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ParallaxProvider } from "react-scroll-parallax";
import Client from "shopify-buy";

// Import your components here
import Home from "./components/Home";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import Bio from "./components/Bio";
import Shop from "./components/Shop/Shop.jsx";
// import Gallery from './components/Gallery';
// import About from './components/About';
// import Contact from './components/Contact';
// import NotFound from './components/NotFound';

import "./App.css";

function App() {
  return (
    <ParallaxProvider>
      <Router>
        <div className="main">
          {window.location !== "/home" && <Navbar />}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/bio" element={<Bio />} />
            <Route path="/shop" element={<Shop />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </ParallaxProvider>
  );
}

export default App;
