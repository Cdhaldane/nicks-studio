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
import { ShopifyProvider, useShop } from "@shopify/hydrogen-react";

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
    <ShopifyProvider
      storeDomain="nickolamagnolia.myshopify.com"
      storefrontToken="cba8d89edc06920e6be78495edd779cc"
      storefrontApiVersion="2022-10"
      countryIsoCode="CA"
      languageIsoCode="EN"
    >
      <AlertProvider>
        <Alert />
        <ParallaxProvider>
          <Router>
            <div className="main">
              {window.location !== "/home" && <Navbar />}
              <Routes>
                <Route path="/nicks-studio" element={<Home />} />
              </Routes>
              <Footer />
            </div>
          </Router>
        </ParallaxProvider>
      </AlertProvider>
    </ShopifyProvider>
  );
}

export default App;
