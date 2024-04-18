import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { ParallaxProvider } from "react-scroll-parallax";
import { AlertProvider } from "./components/Alert/AlertProvider";
import Alert from "./components/Alert/Alert";
import Client from "shopify-buy";

// Import your components here
import Home from "./components/Home";
import About from "./Views/About/Bio.jsx";
import Shop from "./components/Shop/Shop.jsx";
import Music from "./components/Music/Music.jsx";
import Footer from "./components/Footer/Footer.jsx";
import Navbar from "./components/Navbar/Navbar.jsx";
import Banner from "./components/Banner/Banner.jsx";
import MailchimpFormContainer from "./components/MailChimpForm/MailChimpForm.jsx";
import { ShopifyProvider, useShop } from "@shopify/hydrogen-react";

import "./App.css";
import "./components/Styles-Mobile.css";

const Providers = () => {
  return (
    <AlertProvider>
      <App />
    </AlertProvider>
  );
};

function App() {
  const location = useLocation();

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
          <div
            className="main"
            style={{
              backgroundImage:
                location.pathname !== "/" &&
                `url(${process.env.PUBLIC_URL}/n1.jpg)`,
            }}
          >
            {/* <Banner message="Free shipping on orders over $100" /> */}
            {window.location !== "/home" && <Navbar />}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/music" element={<Music />} />
            </Routes>
            {location.pathname !== "/" && <Footer />}
          </div>
        </ParallaxProvider>
      </AlertProvider>
    </ShopifyProvider>
  );
}

export default App;
