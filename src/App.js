import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import your components here
import Home from "./components/Home";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import Bio from "./components/Bio";
// import Gallery from './components/Gallery';
// import About from './components/About';
// import Contact from './components/Contact';
// import NotFound from './components/NotFound';

import "./App.css";

function App() {
  console.log(window.location.pathname);
  return (
    <Router>
      <div className="main">
        {window.location !== "/home" && <Navbar />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bio" element={<Bio />} />
          {/* // <Route path="/about" element={<About />} />
          // <Route path="/contact" element={<Contact />} />
          // <Route path="*" element={<NotFound />} /> */}
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
